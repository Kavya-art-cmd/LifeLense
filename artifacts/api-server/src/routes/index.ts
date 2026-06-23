import { Router, type IRouter } from "express";
import healthRouter from "./health";
import memoriesRouter from "./memories";
import decisionsRouter from "./decisions";
import timelineRouter from "./timeline";
import insightsRouter from "./insights";
import callsRouter from "./calls";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";
import voiceRouter from "./voice";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memoriesRouter);
router.use(decisionsRouter);
router.use(timelineRouter);
router.use(insightsRouter);
router.use(callsRouter);
router.use(chatRouter);
router.use(dashboardRouter);
router.use(voiceRouter);

export default router;
