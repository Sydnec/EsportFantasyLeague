import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma", // Path to your schema
  datasource: {
    url: env("DATABASE_URL"), // Loads from your .env file
  },
});