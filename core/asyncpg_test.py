import asyncio
import asyncpg

async def test_connection():
    conn = await asyncpg.connect(
        user='postgres',
        password='password',
        database='learnindb',
        host='127.0.0.1',
        port=5432
    )
    print("✅ Connected!")
    await conn.close()

asyncio.run(test_connection())

async def test_fetch():
    conn = await asyncpg.connect(
        user='postgres',
        password='password',
        database='learnindb',
        host='127.0.0.1',
        port=5432
    )
    print("0")
    result = await conn.fetch("""
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema');
    """)

    for row in result:
        print(dict(row),'0')


asyncio.run(test_fetch())