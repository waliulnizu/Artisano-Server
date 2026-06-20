export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user আমাদের আগের প্রটেক্ট মিডলওয়্যার থেকে আসছে
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Role (${req.user.role}) is not allowed to access this resource` 
            });
        }
        next();
    };
};