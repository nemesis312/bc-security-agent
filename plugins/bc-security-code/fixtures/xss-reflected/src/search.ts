import type { Request, Response } from "express";

export function searchPage(req: Request, res: Response) {
  const q = String(req.query.q ?? "");
  res.type("html").send(`<h1>Results for ${q}</h1><div id="results"></div>`);
}
