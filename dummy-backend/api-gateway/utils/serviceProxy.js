import axios from "axios";

// Proxy requests to internal microservices
export const serviceProxy = (serviceUrl) => {
  return async (req, res) => {
    try {
      const url = `${serviceUrl}${req.originalUrl}`;
      const method = req.method.toLowerCase();

      const response = await axios({
        method,
        url,
        data: req.body,
        headers: { ...req.headers, host: undefined }, // remove host header
        params: req.query,
      });

      return res.status(response.status).json(response.data);
    } catch (err) {
      if (err.response) {
        return res.status(err.response.status).json(err.response.data);
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  };
};
