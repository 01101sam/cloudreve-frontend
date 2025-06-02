import {
  Box,
  Collapse,
  Popover,
  PopoverProps,
  Slider,
  SvgIconProps,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import AppsListOutlined from "../../Icons/AppsListOutlined.tsx";
import GridOutlined from "../../Icons/GridOutlined.tsx";
import Grid from "../../Icons/Grid.tsx";
import AppsList from "../../Icons/AppsList.tsx";
import NavIconTransition from "../../Frame/NavBar/NavIconTransition.tsx";
import React, { useContext } from "react";
import SessionManager, { UserSettings } from "../../../session";
import {
  Layouts,
  setGalleryWidth,
  setLayout,
  setShowThumb,
} from "../../../redux/fileManagerSlice.ts";
import ImageOutlined from "../../Icons/ImageOutlined.tsx";
import ImageOffOutlined from "../../Icons/ImageOffOutlined.tsx";
import { changePageSize } from "../../../redux/thunks/filemanager.ts";
import ImageCopy from "../../Icons/ImageCopy.tsx";
import ImageCopyOutlined from "../../Icons/ImageCopyOutlined.tsx";

import { FmIndexContext } from "../FmIndexContext.tsx";
import Setting from "../../Icons/Setting.tsx";
import { setListViewColumnSettingDialog } from "../../../redux/globalStateSlice.ts";
import { updateViewPreference } from "../../../api/viewpreference.ts";
import { debounce } from "lodash";
import { getUserSettings } from "../../../api/api.ts";

const layoutOptions: {
  label: string;
  value: string;
  icon: ((props: SvgIconProps) => JSX.Element)[];
}[] = [
  {
    label: "application:fileManager.gridView",
    value: "grid",
    icon: [Grid, GridOutlined],
  },
  {
    label: "application:fileManager.listView",
    value: "list",
    icon: [AppsList, AppsListOutlined],
  },
  {
    label: "application:fileManager.galleryView",
    value: "gallery",
    icon: [ImageCopy, ImageCopyOutlined],
  },
];

const thumbOptions: {
  label: string;
  value: boolean;
  icon: (props: SvgIconProps) => JSX.Element;
}[] = [
  {
    label: "application:fileManager.on",
    value: true,
    icon: ImageOutlined,
  },
  {
    label: "application:fileManager.off",
    value: false,
    icon: ImageOffOutlined,
  },
];

export const MinPageSize = 50;

const ViewOptionPopover = ({ ...rest }: PopoverProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const fmIndex = useContext(FmIndexContext);
  const layout = useAppSelector((state) => state.fileManager[fmIndex].layout);
  const showThumb = useAppSelector(
    (state) => state.fileManager[fmIndex].showThumb,
  );
  const pageSize = useAppSelector(
    (state) => state.fileManager[fmIndex].pageSize,
  );
  const pageSizeMax = useAppSelector(
    (state) => state.fileManager[fmIndex].list?.props.max_page_size,
  );
  const galleryWidth = useAppSelector(
    (state) => state.fileManager[fmIndex].galleryWidth,
  );
  const sortBy = useAppSelector(
    (state) => state.fileManager[fmIndex].sortBy,
  );
  const sortDirection = useAppSelector(
    (state) => state.fileManager[fmIndex].sortDirection,
  );
  const path = useAppSelector(
    (state) => state.fileManager[fmIndex].path,
  );
  const listViewColumns = useAppSelector(
    (state) => state.fileManager[fmIndex].listViewColumns,
  );
  
  const [syncViewPreferences, setSyncViewPreferences] = React.useState(false);
  
  const [desiredPageSize, setDesiredPageSize] = React.useState(pageSize);
  const pageSizeMaxSafe = pageSizeMax ?? desiredPageSize;
  const step = pageSizeMaxSafe - MinPageSize <= 100 ? 1 : 10;
  const [desiredImageWidth, setDesiredImageWidth] =
    React.useState(galleryWidth);

  // Fetch user settings to check if sync is enabled
  React.useEffect(() => {
    dispatch(getUserSettings()).then((settings) => {
      if (settings) {
        setSyncViewPreferences(settings.sync_view_preferences || false);
      }
    });
  }, [dispatch]);

  // Debounced function to save view preferences to cloud
  const saveViewPreferencesToCloud = React.useCallback(
    debounce((currentPath: string, preferences: any) => {
      if (syncViewPreferences) {
        dispatch(updateViewPreference(currentPath || "/", preferences));
      }
    }, 500),
    [syncViewPreferences, dispatch]
  );

  const handleLayoutChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: string,
  ) => {
    if (newMode) {
      dispatch(setLayout({ index: fmIndex, value: newMode }));
      SessionManager.set(UserSettings.Layout, newMode);
      
      // Save to cloud if sync is enabled
      saveViewPreferencesToCloud(path || "/", {
        layout: newMode,
        show_thumb: showThumb,
        sort_by: sortBy || "created_at",
        sort_direction: sortDirection || "asc",
        page_size: pageSize,
        gallery_width: galleryWidth,
        list_columns: JSON.stringify(listViewColumns),
      });
    }
  };

  const handleThumbChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: boolean,
  ) => {
    dispatch(setShowThumb({ index: fmIndex, value: newMode }));
    SessionManager.set(UserSettings.ShowThumb, newMode);
    
    // Save to cloud if sync is enabled
    saveViewPreferencesToCloud(path || "/", {
      layout: layout || "grid",
      show_thumb: newMode,
      sort_by: sortBy || "created_at",
      sort_direction: sortDirection || "asc",
      page_size: pageSize,
      gallery_width: galleryWidth,
      list_columns: JSON.stringify(listViewColumns),
    });
  };

  const handlePageSlideChange = (
    _event: Event,
    newValue: number | number[],
  ) => {
    setDesiredPageSize(newValue as number);
  };

  const commitPageSize = (
    _event: React.SyntheticEvent | Event,
    newValue: number | number[],
  ) => {
    const newPageSize = Math.max(MinPageSize, newValue as number);
    SessionManager.set(UserSettings.PageSize, newPageSize);
    dispatch(changePageSize(fmIndex, newPageSize));
    
    // Save to cloud if sync is enabled
    saveViewPreferencesToCloud(path || "/", {
      layout: layout || "grid",
      show_thumb: showThumb,
      sort_by: sortBy || "created_at",
      sort_direction: sortDirection || "asc",
      page_size: newPageSize,
      gallery_width: galleryWidth,
      list_columns: JSON.stringify(listViewColumns),
    });
  };

  const handleImageSizeChange = (
    _event: Event,
    newValue: number | number[],
  ) => {
    setDesiredImageWidth(newValue as number);
  };

  const commitImageSize = (
    _event: React.SyntheticEvent | Event,
    newValue: number | number[],
  ) => {
    const newGalleryWidth = newValue as number;
    SessionManager.set(UserSettings.GalleryWidth, newGalleryWidth);
    dispatch(setGalleryWidth({ index: fmIndex, value: newGalleryWidth }));
    
    // Save to cloud if sync is enabled
    saveViewPreferencesToCloud(path || "/", {
      layout: layout || "grid",
      show_thumb: showThumb,
      sort_by: sortBy || "created_at",
      sort_direction: sortDirection || "asc",
      page_size: pageSize,
      gallery_width: newGalleryWidth,
      list_columns: JSON.stringify(listViewColumns),
    });
  };

  return (
    <Popover
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      {...rest}
    >
      <Box sx={{ p: 2, minWidth: "300px" }}>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ mb: 0.5, ml: 0.5 }}
            color={"text.secondary"}
          >
            {t("application:fileManager.layout")}
          </Typography>
          <ToggleButtonGroup
            value={layout}
            onChange={handleLayoutChange}
            fullWidth
            size="small"
            color="primary"
            exclusive
          >
            {layoutOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                <NavIconTransition
                  iconProps={{ fontSize: "small" }}
                  sx={{ mr: 1, height: "20px" }}
                  fileIcon={option.icon}
                  active={layout === option.value}
                />
                {t(option.label)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Collapse in={layout == Layouts.grid}>
          <Typography
            variant="subtitle2"
            sx={{ mt: 1.5, mb: 0.5, ml: 0.5 }}
            color={"text.secondary"}
          >
            {t("application:fileManager.thumbnails")}
          </Typography>
          <ToggleButtonGroup
            onChange={handleThumbChange}
            value={showThumb}
            fullWidth
            size="small"
            color="primary"
            exclusive
          >
            {thumbOptions.map((option) => (
              <ToggleButton key={option.label} value={option.value}>
                <option.icon
                  sx={{ mr: 1, height: "20px" }}
                  fontSize={"small"}
                />
                {t(option.label)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Collapse>
        <Collapse in={layout == Layouts.list}>
          <Typography
            variant="subtitle2"
            sx={{ mt: 1.5, mb: 0.5, ml: 0.5 }}
            color={"text.secondary"}
          >
            {t("application:fileManager.listColumnSetting")}
          </Typography>
          <ToggleButtonGroup
            value={0}
            fullWidth
            size="small"
            color="primary"
            exclusive
          >
            <ToggleButton
              value={1}
              onClick={() => dispatch(setListViewColumnSettingDialog(true))}
            >
              <Setting sx={{ mr: 1, height: "20px" }} fontSize={"small"} />
              {t("application:fileManager.listColumnSetting")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Collapse>
        <Collapse in={layout == Layouts.gallery}>
          <Typography
            variant="subtitle2"
            sx={{ mt: 1.5, mb: 0.5, ml: 0.5 }}
            color={"text.secondary"}
          >
            {t("application:fileManager.imageSize")}
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              size={"small"}
              value={desiredImageWidth}
              valueLabelDisplay="auto"
              step={10}
              onChange={handleImageSizeChange}
              onChangeCommitted={commitImageSize}
              min={50}
              max={500}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color={"text.secondary"}>
                50
              </Typography>
              <Typography variant="body2" color={"text.secondary"}>
                500
              </Typography>
            </Box>
          </Box>
        </Collapse>
        <Typography
          variant="subtitle2"
          sx={{ mt: 1.5, mb: 0.5, ml: 0.5 }}
          color={"text.secondary"}
        >
          {t("application:fileManager.paginationSize")}
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            size={"small"}
            value={desiredPageSize}
            valueLabelDisplay="auto"
            step={step}
            onChange={handlePageSlideChange}
            onChangeCommitted={commitPageSize}
            min={MinPageSize}
            max={pageSizeMaxSafe}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color={"text.secondary"}>
              {MinPageSize}
            </Typography>
            <Typography variant="body2" color={"text.secondary"}>
              {pageSizeMaxSafe}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Popover>
  );
};

export default ViewOptionPopover;
