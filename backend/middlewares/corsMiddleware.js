import cors from "cors";

const PORT  = Number(process.env.PORT || 3000);

const origemPermitida = [
    process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:'+PORT,
    'http://127.0.0.1:'+PORT
];

export default cors({
    origin: origemPermitida,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders:['Content-Type', 'Authorization']
});