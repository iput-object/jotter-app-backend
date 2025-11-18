const { version } = require("../../package.json");
const config = require("../config/config");

const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "Monolithic Template",
    version,
    license: {},
  },
  servers: [
    {
      url: `http://${process.env.BACKEND_IP}:${config.port}/v1`,
    },
  ],
};

module.exports = swaggerDef;
