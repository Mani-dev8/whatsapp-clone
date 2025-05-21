"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const routes_1 = require("./routes"); // TSOA-generated routes
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json")); // TSOA-generated Swagger spec
function registerRoutes(app) {
    // Register TSOA routes
    (0, routes_1.RegisterRoutes)(app);
    // Serve Swagger UI
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Whatsapp Clone API Docs',
        customfavIcon: "/assets/favicon.ico"
    }));
}
