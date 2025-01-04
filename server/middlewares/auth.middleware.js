

export const verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
  
    if (!token) {
      return res.status(403).send({
        message: "No token provided!"
      });
    }
  
    let validationRes = verifyToken(token);
    if(validationRes.status == 'VALID') {
      req.userId = validationRes.payload.id;
      next();
    } else {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    };
};

export const isTokenPresent = (req, res, next) => {
    let token = req.headers["x-access-token"];
    if (!token) {
      return res.status(403).send({
        message: "No token provided!"
      });
    }
    next();
};
