import { useEffect, useState } from "react";
import { AwsClient } from "aws4fetch";

const aws = new AwsClient({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
});

type useUploadImagePayload = {
  fileId: string;
  file: ArrayBuffer;
};
const useUploadImage = (payload: useUploadImagePayload) => {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [data, setData] = useState("");

  const uploadImage = async (payload: useUploadImagePayload) => {
    const { fileId, file } = payload;

    if (!fileId || !file) {
      setFailed(true);
      setLoading(false);
      setData("");
      return;
    }

    setLoading(true);

    const res = await aws.fetch(`${process.env.REACT_APP_AWS_URL}/${fileId}`, {
      method: "PUT",
      headers: {
        "x-api-key": process.env.REACT_APP_AWS_X_API_KEY,
        "Content-Type": "image/jpeg"
      },
      body: file
    });

    // return empty string if we can't find such image
    if (res.status !== 200) {
      setFailed(true);
      setLoading(false);
      setData("");
      return;
    }

    setFailed(false);
    setLoading(false);
    setData("success");
  };

  useEffect(() => {
    uploadImage(payload);
  }, []);

  return { loading, failed, data };
};

export default useUploadImage;
