import asyncio
import logging

from core.celery_app import celery_app
from assistance.document_processor import \
    document_processor_singleton as document_processor
from core.db import BookChat, get_async_session

logging.basicConfig(level=logging.INFO)


def run_async(coro):
    """Helper to run async code in a sync Celery task."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(coro)


@celery_app.task(bind=True)
def process_document_task(self, file_path: str, file_id: str, filename: str, user_id: int):
    """
    Celery задача для обработки документа: сохраняет метаданные,
    генерирует эмбеддинги и создает связанный чат.
    """
    async def _process_async():
        logging.info(f"Task {self.request.id}: Starting processing for file_id: {file_id}")
        try:
            async with get_async_session() as session:
                # Предполагаем, что эта функция обрабатывает файл и сохраняет информацию о нем в БД
                doc_info = await document_processor.save_document(
                    file_path=file_path,
                    filename=filename,
                    db=session,
                    file_id_override=file_id # Передаем наш file_id для консистентности
                )

                # Создаем чат для документа
                book_chat = BookChat(
                    file_id=doc_info.file_id,
                    name=f"Chat for {filename}",
                    user_id=user_id
                )
                session.add(book_chat)
                await session.commit()
                await session.refresh(book_chat)

                logging.info(f"Task {self.request.id}: Successfully processed file_id: {file_id}")
                return {"status": "Success", "file_id": doc_info.file_id, "book_chat_id": book_chat.id}
        except Exception as e:
            logging.error(f"Task {self.request.id}: Error processing file_id: {file_id}, error: {e}", exc_info=True)
            # Перевыбрасываем исключение, чтобы Celery пометил задачу как 'FAILURE'
            raise

    try:
        return run_async(_process_async())
    except Exception as e:
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise e

from fastapi import APIRouter
from celery.result import AsyncResult
from core.celery_app import celery_app

router = APIRouter()

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Получить статус и результат выполнения задачи Celery.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
    
    if task_result.failed():
        response['result'] = str(task_result.info)

    return response 