import React, { useState, useEffect } from "react";
import {
  LinearProgress,
  Snackbar,
  Card,
  CardContent,
  Typography,
  makeStyles
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import Skeleton from "@material-ui/lab/Skeleton";
import { Image as ImageIcon } from "@material-ui/icons";
import useGetImageUrl from "../../utils/useGetImageUrl";
import useUploadImage from "../../utils/useUploadImage";
import { imageMapVar } from "../../api/cache";

const useStyles = makeStyles(theme => ({
  centeredBlock: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%"
  },
  localChildren: {
    width: "100%"
  },
  errorMessage: {
    color: theme.palette.error.main
  },
  placeholder: {
    height: 250
  },
  imageErrorContainer: {
    marginLeft: "auto",
    marginRight: "auto",
    width: 250
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "&:last-child": {
      paddingBottom: theme.spacing(2)
    }
  },
  imageIcon: {
    fontSize: 60,
    marginBottom: theme.spacing(1)
  }
}));

const ImageError: React.FC = () => {
  const classes = useStyles();
  return (
    <Card className={classes.imageErrorContainer}>
      <CardContent className={classes.cardContent}>
        <Typography variant="h6" component="h6" gutterBottom>
          Cannot Load Image
        </Typography>
        <ImageIcon className={classes.imageIcon} />
        <Typography color="textSecondary" variant="caption">
          There was an error loading this image
        </Typography>
      </CardContent>
    </Card>
  );
};

const getUrlFromArrayBuffer = (arrayBuffer: ArrayBuffer) => {
  const arrayBufferView = new Uint8Array(arrayBuffer);
  const blob = new Blob([arrayBufferView]);
  return URL.createObjectURL(blob);
};

const LocalImage: React.FC = ({ blockProps }: any) => {
  const [showUploadSuccessAlert, setShowUploadSuccessAlert] = useState(false);
  const classes = useStyles();

  const id = blockProps.id as string;
  const imgMap = imageMapVar();
  const imgArrayBuffer = imgMap[id];

  // Local image, we generate an object url to display it locally
  const imgUrl = getUrlFromArrayBuffer(imgArrayBuffer);

  // Upload image via custom hook
  const { loading, failed, data } = useUploadImage({
    fileId: id,
    file: imgArrayBuffer
  });

  useEffect(() => {
    return () => {
      // Remove the image info from imageMapVar global state
      // so that it doesn't get uploaded multiple times
      const { [id]: deleted, ...rest } = imageMapVar();
      imageMapVar(rest);

      // Revoke img url on unmount
      URL.revokeObjectURL(imgUrl);
    };
  }, []);

  useEffect(() => {
    if (data === "success") {
      setShowUploadSuccessAlert(true);
    }
  }, [data]);

  const handleAlertClose = () => {
    setShowUploadSuccessAlert(false);
  };

  if (imgUrl) {
    return (
      <div className={classes.centeredBlock}>
        <img src={imgUrl} className={classes.localChildren} />
        {loading && <LinearProgress className={classes.localChildren} />}
        {failed && (
          <div className={classes.errorMessage}>
            Image upload failed, please try again
          </div>
        )}
        <Snackbar
          open={showUploadSuccessAlert}
          autoHideDuration={5000}
          onClose={handleAlertClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="success" onClose={handleAlertClose}>
            Image uploaded
          </Alert>
        </Snackbar>
      </div>
    );
  }

  return null;
};

const RemoteImage: React.FC = ({ blockProps }: any) => {
  const classes = useStyles();
  const placeholderClass = `${classes.centeredBlock} ${classes.placeholder}`;

  const { id } = blockProps;
  // // Get image from S3 bucket by file ID via custom hook
  const { loading, failed, data: imgUrl } = useGetImageUrl(id);

  useEffect(() => {
    return () => {
      // Revoke img url on unmount
      URL.revokeObjectURL(imgUrl);
    };
  }, []);

  if (loading) {
    return <Skeleton variant="rect" className={placeholderClass} />;
  }

  if (failed) {
    return <ImageError />;
  }

  if (imgUrl) {
    return <img src={imgUrl} className={classes.centeredBlock} />;
  }

  return null;
};

// Calculate if this image is local, i.e., did the user just added this image when writing/editing.
// if it is local, we generate an object url and upload the image,
// otherwise, we simply get the image from the backend and display it
const MediaComponent: React.FC = (props: any) => {
  const { id } = props.blockProps;
  const imgMap = imageMapVar();
  // There is such an ID in the imgMap object, which means this image was
  // just added by the user, and dosen't yet exist on the backend
  const isLocal = Object.keys(imgMap).includes(id);

  if (isLocal) {
    return <LocalImage {...props} />;
  }
  return <RemoteImage {...props} />;
};

export default MediaComponent;
