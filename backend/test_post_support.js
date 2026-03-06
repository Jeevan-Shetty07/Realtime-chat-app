import axios from 'axios';

const testCreateIssue = async () => {
  const API_URL = 'http://localhost:5001/api/support';
  // We need a way to get a token, but for now we'll just check if the endpoint responds
  try {
    const res = await axios.post(API_URL, {
      subject: 'Test Subject from Script',
      message: 'Test Message from Script'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error('Error message:', err.response?.data?.message);
  }
};

testCreateIssue();
