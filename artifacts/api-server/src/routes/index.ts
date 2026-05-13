import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import categoriesRouter from "./categories.js";
import shopsRouter from "./shops.js";
import techniciansRouter from "./technicians.js";
import productsRouter from "./products.js";
import servicesRouter from "./services.js";
import bookingsRouter from "./bookings.js";
import reviewsRouter from "./reviews.js";
import adminRouter from "./admin.js";
import locationRouter from "./location.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/categories", categoriesRouter);
router.use("/shops", shopsRouter);
router.use("/technicians", techniciansRouter);
router.use("/products", productsRouter);
router.use("/services", servicesRouter);
router.use("/bookings", bookingsRouter);
router.use("/reviews", reviewsRouter);
router.use("/admin", adminRouter);
router.use("/location", locationRouter);

export default router;
