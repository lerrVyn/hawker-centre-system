// Lervyn Ang
// Run with: node swagger.js  ->  generates swagger-output.json
const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Hawker Centre Management System API",
    description: "REST API for the Hawker Centre Management System.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000", description: "Local dev server" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger spec generated at swagger-output.json");
});