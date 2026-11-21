import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def main():
    print("Inside main async with Selector policy", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
    print("Completed cleanly", flush=True)
