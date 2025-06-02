import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import {
  getColumnTypeDefaults,
  ListViewColumn,
  ListViewColumnSetting,
} from "./Column.tsx";
import ListHeader from "./ListHeader.tsx";
import ListBody from "./ListBody.tsx";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks.ts";
import { FmIndexContext } from "../../FmIndexContext.tsx";
import { setListViewColumns } from "../../../../redux/fileManagerSlice.ts";
import SessionManager, { UserSettings } from "../../../../session";
import { SearchLimitReached } from "../EmptyFileList.tsx";
import { getUserSettings } from "../../../../api/api.ts";
import { updateViewPreference } from "../../../../api/viewpreference.ts";

const ListView = React.forwardRef(
  (
    {
      ...rest
    }: {
      [key: string]: any;
    },
    ref,
  ) => {
    const { t } = useTranslation("application");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const dispatch = useAppDispatch();
    const fmIndex = useContext(FmIndexContext);
    const recursion_limit_reached = useAppSelector(
      (state) => state.fileManager[fmIndex].list?.recursion_limit_reached,
    );
    const columnSetting = useAppSelector(
      (state) => state.fileManager[fmIndex].listViewColumns,
    );
    const path = useAppSelector(
      (state) => state.fileManager[fmIndex].path,
    );
    const layout = useAppSelector((state) => state.fileManager[fmIndex].layout);
    const showThumb = useAppSelector(
      (state) => state.fileManager[fmIndex].showThumb,
    );
    const sortBy = useAppSelector(
      (state) => state.fileManager[fmIndex].sortBy,
    );
    const sortDirection = useAppSelector(
      (state) => state.fileManager[fmIndex].sortDirection,
    );
    const pageSize = useAppSelector(
      (state) => state.fileManager[fmIndex].pageSize,
    );
    const galleryWidth = useAppSelector(
      (state) => state.fileManager[fmIndex].galleryWidth,
    );
    
    const [syncViewPreferences, setSyncViewPreferences] = useState(false);

    const [columns, setColumns] = useState<ListViewColumn[]>(
      columnSetting.map(
        (c): ListViewColumn => ({
          type: c.type,
          width: c.width,
          defaults: getColumnTypeDefaults(c, isMobile),
        }),
      ),
    );
    
    // Fetch user settings to check if sync is enabled
    useEffect(() => {
      dispatch(getUserSettings()).then((settings) => {
        if (settings) {
          setSyncViewPreferences(settings.sync_view_preferences || false);
        }
      });
    }, [dispatch]);

    useEffect(() => {
      setColumns(
        columnSetting.map(
          (c): ListViewColumn => ({
            type: c.type,
            width: c.width,
            defaults: getColumnTypeDefaults(c, isMobile),
          }),
        ),
      );
    }, [columnSetting]);

    const totalWidth = useMemo(() => {
      return columns.reduce(
        (acc, column) => acc + (column.width ?? column.defaults.width),
        0,
      );
    }, [columns]);

    const commitColumnSetting = useCallback(() => {
      let settings: ListViewColumnSetting[] = [];
      setColumns((prev) => {
        settings = [
          ...prev.map((c) => ({
            type: c.type,
            width: c.width,
          })),
        ];
        return prev;
      });
      if (settings.length > 0) {
        dispatch(setListViewColumns(settings));
        SessionManager.set(UserSettings.ListViewColumns, settings);
        
        // Save to cloud if sync is enabled
        if (syncViewPreferences) {
          dispatch(updateViewPreference(path || "/", {
            layout: layout || "grid",
            show_thumb: showThumb,
            sort_by: sortBy || "created_at",
            sort_direction: sortDirection || "asc",
            page_size: pageSize,
            gallery_width: galleryWidth,
            list_columns: JSON.stringify(settings),
          }));
        }
      }
    }, [dispatch, setColumns, syncViewPreferences, path, layout, showThumb, sortBy, sortDirection, pageSize, galleryWidth]);

    return (
      <Box
        ref={ref}
        {...rest}
        sx={{
          minWidth: totalWidth + 44,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ListHeader
          commitColumnSetting={commitColumnSetting}
          setColumns={setColumns}
          columns={columns}
        />
        <ListBody columns={columns} />
        {recursion_limit_reached && (
          <Box sx={{ px: 1, py: 1 }}>
            <SearchLimitReached />
          </Box>
        )}
      </Box>
    );
  },
);

export default ListView;
