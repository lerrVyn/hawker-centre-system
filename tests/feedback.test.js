// Lervyn Ang
// Example unit tests for routes/feedback.js using Jest + Supertest.
// Mocks the "mssql" package directly since this project isn't split into
// controller/model files (per Wk13 slides: mock the DB library, test
// success + error cases).
const request = require("supertest");
const express = require("express");
const sql = require("mssql");

jest.mock("mssql");
jest.mock("../middleware/authMiddleware", () =>
  (req, res, next) => {
    req.user = { customer_id: 1 };
    next();
  }
);

const feedbackRouter = require("../routes/feedback");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/feedback", feedbackRouter);
  return app;
}

describe("GET /feedback/stall/:stall_id", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  it("returns 400 for a non-numeric stall_id", async () => {
    const res = await request(app).get("/feedback/stall/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid stall_id/);
  });

  it("returns 404 when the stall does not exist", async () => {
    const mockPool = {
      request: () => ({
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({ recordset: [] }),
      }),
    };
    sql.connect.mockResolvedValue(mockPool);

    const res = await request(app).get("/feedback/stall/999");
    expect(res.status).toBe(404);
  });

  it("returns feedback + average rating for an existing stall", async () => {
    let callCount = 0;
    const mockPool = {
      request: () => ({
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockImplementation(() => {
          callCount += 1;
          if (callCount === 1) {
            return Promise.resolve({ recordset: [{ stall_id: 1 }] });
          }
          if (callCount === 2) {
            return Promise.resolve({
              recordset: [
                { feedback_id: 1, customer_name: "Alice", rating: 5, comment: "Great!", created_at: new Date() },
              ],
            });
          }
          return Promise.resolve({ recordset: [{ average_rating: 5, total_reviews: 1 }] });
        }),
      }),
    };
    sql.connect.mockResolvedValue(mockPool);

    const res = await request(app).get("/feedback/stall/1");
    expect(res.status).toBe(200);
    expect(res.body.average_rating).toBe(5);
    expect(res.body.total_reviews).toBe(1);
    expect(res.body.feedback).toHaveLength(1);
  });

  it("returns 500 when the database call fails", async () => {
    sql.connect.mockRejectedValue(new Error("DB down"));

    const res = await request(app).get("/feedback/stall/1");
    expect(res.status).toBe(500);
  });
});

describe("POST /feedback", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  it("returns 400 when rating is out of range", async () => {
    const res = await request(app)
      .post("/feedback")
      .send({ stall_id: 1, rating: 9, comment: "too high" });

    expect(res.status).toBe(400);
  });

  it("creates feedback for a valid, authenticated request", async () => {
  const queryMock = jest
    .fn()
    .mockResolvedValueOnce({ recordset: [{ stall_id: 1 }] }) // stall check
    .mockResolvedValueOnce({
      recordset: [{ feedback_id: 10, stall_id: 1, rating: 4, comment: "Good" }],
    }); // insert

  const mockPool = {
    request: () => ({
      input: jest.fn().mockReturnThis(),
      query: queryMock, // same mock reused across both pool.request() calls
    }),
  };
  sql.connect.mockResolvedValue(mockPool);

  const res = await request(app)
    .post("/feedback")
    .send({ stall_id: 1, rating: 4, comment: "Good" });

  expect(res.status).toBe(201);
  expect(res.body.feedback.feedback_id).toBe(10);
});
});