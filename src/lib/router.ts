import express, { Router as ExpressRouter } from "express";

export default function Router(): ExpressRouter {
  const router = express.Router();

  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  return router;
}
