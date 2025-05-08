import "dotenv/config";
import express, { Request, Response, Application } from "express";
const app: Application = express();
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.URL,
});
redisClient
  .connect()
  .then(() => console.log("✅ Redis connected"))
  .catch((err) => console.error("❌ Redis connection failed:", err));

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello Dev!!!");
});

app.get("/posts", async (_req: Request, res: Response) => {
  try {
    console.log("Fetching posts...");
    const chunk = await fetch("https://jsonplaceholder.typicode.com/photos");
    const data = await chunk.json();

    console.log("Setting posts to Redis...");
    const result = await redisClient.set("posts", JSON.stringify(data));
    console.log("Redis SET result:", result); // Should log "OK"

    res.status(200).json({
      success: true,
      message: "All posts fetched!",
      data,
    });
  } catch (error: unknown) {
    console.error("Error in /posts - ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cache = await redisClient.get(`posts:${id}`); //check cache exist or not
    if (cache)
      res.status(200).json({
        success: true,
        message: "single post fetched!",
        data: JSON.parse(cache),
      });
    // if exist then return that data
    else {
      //if not exist the fetched the data and return it
      const chunk = await fetch(
        `https://jsonplaceholder.typicode.com/photos/${id}`
      );
      const data = await chunk.json();
      await redisClient.set(`posts:${id}`, JSON.stringify(data));

      res.status(200).json({
        success: true,
        message: "single post fetched!",
        data,
      });
    }
  } catch (error: unknown) {
    console.error("Error in /posts/:id - ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default app;
