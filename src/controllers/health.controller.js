export const healthCheck = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Artisano Server is running perfectly with modular architecture! 🚀',
    });
};