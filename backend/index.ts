import { Hono } from "hono";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "hono/logger";

const app = new Hono();
app.use(logger());

app.get("/", (c) => c.text("Welcome to the ISRO Press Releases API"));

app.get("/api/press-releases", async (c) => {
  try {
    const response = await axios.get("https://www.isro.gov.in/Press.html");
    const html = response.data;

    const $ = cheerio.load(html);
    const pressReleases: {
      title: string;
      date: string;
      link: string;
    }[] = [];

    $("table tbody tr").each((_index, element) => {
      const titleElement = $(element).find("td a");
      const titleText = titleElement.text().trim().replace(/\n\s*/g, " ");
      const rawDate = $(element).find("td").last().text().trim();
      const href = titleElement.attr("href");

      const dateObject = new Date(rawDate);
      const day = dateObject.getDate().toString().padStart(2, "0"); // Get day as two digits
      const month = (dateObject.getMonth() + 1).toString().padStart(2, "0"); // Get month as two digits (months are zero-based)
      const year = dateObject.getFullYear();

      const formattedDate = `${day}-${month}-${year}`;

      if (!isNaN(dateObject.getTime()) && titleText && href) {
        const link = new URL(href, "https://www.isro.gov.in/").toString();
        pressReleases.push({
          title: titleText,
          date: formattedDate,
          link,
        });
      }
    });

    return c.json(pressReleases);
  } catch (error) {
    return c.json({ error: "Failed to fetch press releases" }, 500);
  }
});

export default app;
