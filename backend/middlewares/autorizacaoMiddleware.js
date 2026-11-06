function autorizacaoMiddleware(...perfisPermitidos){
    return function autorizar(req, res, next){
        if (!req.usuario){
            return res.status(401).json({
                message: 'Autenticação necessária.'
            });
        }
        if(!perfisPermitidos.includes(req.usuario.perfil)){
            return res.status(409).json({
                message: 'Seu perfil não tem permissão para esta operação.'
            })
        }
        next();
    };
}

export {autorizacaoMiddleware};