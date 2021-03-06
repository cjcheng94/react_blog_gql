"use strict";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Editor,
  EditorState,
  ContentState,
  RichUtils,
  ContentBlock,
  getDefaultKeyBinding,
  convertToRaw,
  AtomicBlockUtils,
  convertFromRaw,
  CompositeDecorator
} from "draft-js";
import { Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { Map } from "immutable";
import { v4 as uuidv4 } from "uuid";
import {
  MediaComponent,
  LinkComponent,
  CodeBlock,
  RichTextControls
} from "@components";
import { imageMapVar } from "../../api/cache";
import useStyles from "./RichStyles";

const getBlockStyle = (block: ContentBlock) => {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return "";
  }
};

const findLinkEntities = (
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
  contentState: ContentState
) => {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
};

type RichTextEditorProps = {
  onChange?: (richData: string, plainText: string) => void;
  isEmpty?: (isEmpty: boolean) => void;
  readOnly?: boolean;
  rawContent?: string;
};

const RichTextEditor: React.FC<RichTextEditorProps> = props => {
  const [showFileSizeAlert, setShowFileSizeAlert] = useState(false);
  const { onChange, readOnly, rawContent, isEmpty } = props;
  const editor = React.useRef<Editor>(null);
  const classes = useStyles();

  const initailEditorState = () => {
    const compositeDecorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: LinkComponent
      }
    ]);
    if (rawContent) {
      // If rawContent is not compatible json format, catch the error
      // and create empty state
      try {
        // edit and preview existing content
        const contentStateFromRaw = convertFromRaw(JSON.parse(rawContent));
        const editorStateFromRaw = EditorState.createWithContent(
          contentStateFromRaw,
          compositeDecorator
        );
        return editorStateFromRaw;
      } catch (err) {
        return EditorState.createEmpty(compositeDecorator);
      }
    }
    // create new content
    return EditorState.createEmpty(compositeDecorator);
  };

  const [editorState, setEditorState] = useState<EditorState>(
    initailEditorState()
  );
  const [liveCodeBlockEdit, setLiveCodeBlockEdit] = useState(Map());

  const memoizedRichData = useMemo(
    () => JSON.stringify(convertToRaw(editorState.getCurrentContent())),
    [editorState]
  );

  const memoizedPlainText = useMemo(
    () => editorState.getCurrentContent().getPlainText(" "),
    [editorState]
  );

  useEffect(() => {
    onChange && onChange(memoizedRichData, memoizedPlainText);
    if (isEmpty) {
      const contentState = editorState.getCurrentContent();
      isEmpty(!contentState.hasText());
    }
  }, [memoizedRichData, memoizedPlainText]);

  const focusEditor = useCallback(() => {
    if (editor.current) {
      editor.current.focus();
    }
  }, [editor]);

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" /* TAB */) {
      const newEditorState = RichUtils.onTab(e, editorState, 4 /* maxDepth */);
      if (newEditorState !== editorState) {
        setEditorState(newEditorState);
      }
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  const toggleStyle = (type: "inline" | "block") => {
    if (type === "block") {
      return (blockType: string) => {
        setEditorState(RichUtils.toggleBlockType(editorState, blockType));
      };
    }
    return (inlineStyle: string) => {
      setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    };
  };

  // Handle images
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();

    // Upload image to S3 bucket with a random ID,
    // and save this ID to an image entity
    // so we can use it to get the image later
    const handleImage = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        return;
      }

      const randomFileId = uuidv4();
      // Save the file info in imageMapVar global state in { id: arraybuffer } format
      const previmageMap = imageMapVar();
      imageMapVar({
        ...previmageMap,
        [randomFileId]: reader.result
      });

      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(
        "IMAGE",
        "IMMUTABLE",
        { id: randomFileId }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = EditorState.set(editorState, {
        currentContent: contentStateWithEntity
      });
      setEditorState(
        AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " ")
      );
    };

    reader.addEventListener("load", handleImage);

    if (event.target.files) {
      const file = event.target.files[0];

      // File size limit of 5 MB
      if (file.size > 5 * 1024 * 1024) {
        setShowFileSizeAlert(true);
      } else {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  // Insert custom code block
  const insertCodeBlock = () => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "CODE_BLOCK",
      "IMMUTABLE",
      { foo: "bar" }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    setEditorState(
      AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " ")
    );
  };

  // Create links
  const insertLink = (url: string) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      { url }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    setEditorState(
      RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      )
    );
  };

  const removeLink = () => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      setEditorState(RichUtils.toggleLink(editorState, selection, null));
    }
  };

  // Render image with custom MediaComponent
  const renderBlock = (contentBlock: ContentBlock) => {
    const blockType = contentBlock.getType();
    if (blockType === "atomic") {
      const entityKey = contentBlock.getEntityAt(0);
      const entity = editorState.getCurrentContent().getEntity(entityKey);
      const entityData = entity.getData();
      const entityType = entity.getType();

      // render custom image component
      if (entityType === "IMAGE") {
        return {
          component: MediaComponent,
          editable: false,
          props: { id: entityData.id }
        };
      }

      // render custom code block
      if (entityType === "CODE_BLOCK") {
        return {
          component: CodeBlock,
          editable: false,
          props: {
            readOnly,
            onStartEdit: (blockKey: any) => {
              setLiveCodeBlockEdit(liveCodeBlockEdit.set(blockKey, true));
            },
            onFinishEdit: (blockKey: any, newContentState: any) => {
              setLiveCodeBlockEdit(liveCodeBlockEdit.remove(blockKey));
              setEditorState(EditorState.createWithContent(newContentState));
            }
          }
        };
      }
    }
    return;
  };

  const handleAlertClose = () => {
    setShowFileSizeAlert(false);
  };

  return (
    <div>
      {!readOnly && (
        <RichTextControls
          editorState={editorState}
          onToggle={toggleStyle}
          insertLink={insertLink}
          removeLink={removeLink}
          insertCodeBlock={insertCodeBlock}
        />
      )}
      <div className={classes.editor} onClick={focusEditor}>
        <Editor
          blockStyleFn={getBlockStyle}
          blockRendererFn={renderBlock}
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          onChange={setEditorState}
          placeholder="Tell a story..."
          ref={editor}
          readOnly={readOnly || !!liveCodeBlockEdit.count()}
          spellCheck={true}
        />
      </div>
      <input
        id="imageInput"
        className={classes.fileInput}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <Snackbar
        open={showFileSizeAlert}
        autoHideDuration={5000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={handleAlertClose}>
          File exceeded 5 MB size limit
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RichTextEditor;
