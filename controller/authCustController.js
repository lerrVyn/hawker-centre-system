//ziying
exports.test = (req, res) => {

    res.json({
        success: true,
        message: "Customer auth route is working!"
    });

};

exports.register = (req, res) => {

    const { name, email, password, phone } = req.body;

    res.json({
        success: true,
        message: "Data received successfully!",
        data: {
            name,
            email,
            password,
            phone
        }
    });

};