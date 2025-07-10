import os
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from dotenv import load_dotenv
from typing import Optional

def generate_image_from_prompt(prompt: str) -> Optional[bytes]:
    """
    Генерирует изображение по промпту с помощью Vertex AI и возвращает его в виде байтов.
    Возвращает None, если изображение не было сгенерировано.
    """
    load_dotenv()
    
    PROJECT_ID = os.getenv("GCP_PROJECT")
    LOCATION = os.getenv("GCP_LOCATION")
    
    if not PROJECT_ID or not LOCATION:
        raise ValueError("GCP_PROJECT и GCP_LOCATION должны быть установлены.")

    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = ImageGenerationModel.from_pretrained("imagegeneration@006")

    images = model.generate_images(
        prompt=prompt,
        number_of_images=1,
    )
    
    if not images:
        return None # Возвращаем None, если список пуст

    return images[0]._image_bytes

# Удаляем тестовый вызов из глобальной области видимости
# if __name__ == '__main__':
#     # Сюда можно поместить тестовый код
#     img_bytes = generate_image_from_prompt("a cute puppy")
#     if img_bytes:
#         with open("test.png", "wb") as f:
#             f.write(img_bytes)