import { reviewRouter } from './routers/review-router.js';

// Routes
app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api', eventRouter);
app.use('/api', ticketRouter);
app.use('/api', reviewRouter); 