import axios from 'axios';

// In-memory storage for requestId (needed for OTPLess verification)
const requestStore = new Map();

const { CLIENT_ID, CLIENT_SECRET } = process.env;

const sendOtp = async (req, res) => {
    const { phone, countryCode } = req.body;

    console.log("📥 Incoming POST /send-otp request:");
    console.log("Body:", req.body);
    console.log("Headers:", req.headers);

    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    const fullPhoneNumber = countryCode ? `${countryCode}${phone}` : `+91${phone}`;

    try {
        const response = await axios.post(
            'https://auth.otpless.app/auth/v1/initiate/otp',
            {
                phoneNumber: fullPhoneNumber,
                expiry: 300,
                otpLength: 4,
                channels: ["SMS"],
            },
            {
                headers: {
                    'clientId': CLIENT_ID,
                    'clientSecret': CLIENT_SECRET,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("✅ OTP Request Successful:");
        console.log("Response Data:", response.data);

        // Store the requestId for later verification
        requestStore.set(fullPhoneNumber, response.data.requestId);

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            requestId: response.data.requestId
        });
    } catch (error) {
        console.error("❌ Error sending OTP:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: "Failed to send OTP",
            details: error.response?.data || error.message
        });
    }
};

const verifyOtp = async (req, res) => {
    const { phone, countryCode, otp } = req.body;

    console.log("📥 Incoming POST /verify-otp request:");
    console.log("Body:", req.body);
    console.log("Headers:", req.headers);

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            error: "Phone number and OTP are required"
        });
    }

    const fullPhoneNumber = countryCode ? `${countryCode}${phone}` : `+91${phone}`;
    const requestId = requestStore.get(fullPhoneNumber);

    if (!requestId) {
        return res.status(400).json({
            success: false,
            error: "No OTP request found for this phone number. Please request an OTP first."
        });
    }

    try {
        const response = await axios.post(
            'https://auth.otpless.app/auth/v1/verify/otp',
            {
                phoneNumber: fullPhoneNumber,
                otp: otp,
                requestId: requestId
            },
            {
                headers: {
                    'clientId': CLIENT_ID,
                    'clientSecret': CLIENT_SECRET,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("✅ OTP Verification Response:");
        console.log("Response Data:", response.data);

        // Check if OTP verification was successful
        if (response.data.isOTPVerified === true) {
            // Clear the requestId after successful verification
            requestStore.delete(fullPhoneNumber);

            // Return success response with auth token (if provided by OTPLess)
            const authToken = response.data.authToken || `token_${Date.now()}`; // Fallback if no authToken

            res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                authToken: authToken
            });
        } else {
            console.log("❌ OTP Verification Failed:");
            res.status(400).json({
                success: false,
                error: "Invalid OTP"
            });
        }
    } catch (error) {
        console.error("❌ Error verifying OTP:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: "Failed to verify OTP",
            details: error.response?.data || error.message
        });
    }
};

export { sendOtp, verifyOtp };