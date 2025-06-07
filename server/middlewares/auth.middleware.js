import { verifyJwtToken } from "../components/jwt";
import { getUserRoles } from "../db/role";

export const verifyToken = async (req, res, next) => {
    let token = req.headers["x-access-token"];
  
    if (!token) {
      return res.status(403).send({
        message: "No token provided!"
      });
    }
  
    let validationRes = await verifyJwtToken(token);
    if(validationRes.status == 'VALID') {
      req.userId = validationRes.payload.id;
      const roles = await getUserRoles(req.userId);
      req.user = req.user || {};
      req.user.roles = roles;
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

export const verifyRole = (requiredRoles) => {
  return (req, res, next) => {
      const userRoles = req.user.roles; // Assume `req.user` is populated after authentication
      console.log('UserRoles:', userRoles);
      console.log('RequiredRoles:', requiredRoles);
      if (!requiredRoles.some(element => userRoles.includes(element))) {
          return res.status(403).send({ message: "Access Denied: Insufficient permissions" });
      }
      next();
  };
};