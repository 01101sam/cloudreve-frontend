import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuProps,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import React, { useContext, useMemo } from "react";
import Checkmark from "../../Icons/Checkmark.tsx";
import { changeSortOption } from "../../../redux/thunks/filemanager.ts";
import SessionManager, { UserSettings } from "../../../session";
import { getUserSettings } from "../../../api/api.ts";
import { updateViewPreference } from "../../../api/viewpreference.ts";
import { debounce } from "lodash";

import { FmIndexContext } from "../FmIndexContext.tsx";

interface sortOption {
  label: string;
  order_by: string;
  order_direction: string;
  selected?: boolean;
}

const supportOption: {
  [key: string]: sortOption;
} = {
  name_asc: {
    label: "application:fileManager.sortMethods.A-Z",
    order_by: "name",
    order_direction: "asc",
  },
  name_desc: {
    label: "application:fileManager.sortMethods.Z-A",
    order_by: "name",
    order_direction: "desc",
  },
  size_asc: {
    label: "application:fileManager.sortMethods.smallest",
    order_by: "size",
    order_direction: "asc",
  },
  size_desc: {
    label: "application:fileManager.sortMethods.largest",
    order_by: "size",
    order_direction: "desc",
  },
  updated_at_asc: {
    label: "application:fileManager.sortMethods.oldestModified",
    order_by: "updated_at",
    order_direction: "asc",
  },
  updated_at_desc: {
    label: "application:fileManager.sortMethods.newestModified",
    order_by: "updated_at",
    order_direction: "desc",
  },
  created_at_asc: {
    label: "application:fileManager.sortMethods.oldestUploaded",
    order_by: "created_at",
    order_direction: "asc",
  },
  created_at_desc: {
    label: "application:fileManager.sortMethods.newestUploaded",
    order_by: "created_at",
    order_direction: "desc",
  },
  _asc: {
    label: "application:fileManager.sortMethods.oldestUploaded",
    order_by: "created_at",
    order_direction: "asc",
  },
  _desc: {
    label: "application:fileManager.sortMethods.oldestUploaded",
    order_by: "created_at",
    order_direction: "asc",
  },
};

const SortMethodMenu = ({ onClose, ...rest }: MenuProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const fmIndex = useContext(FmIndexContext);
  const orderMethodOptions = useAppSelector(
    (state) => state.fileManager[fmIndex].list?.props.order_by_options,
  );
  const orderDirectionOption = useAppSelector(
    (state) => state.fileManager[fmIndex].list?.props.order_direction_options,
  );
  const sortBy = useAppSelector((state) => state.fileManager[fmIndex].sortBy);
  const sortDirection = useAppSelector(
    (state) => state.fileManager[fmIndex].sortDirection,
  );
  const path = useAppSelector(
    (state) => state.fileManager[fmIndex].path,
  );
  const layout = useAppSelector((state) => state.fileManager[fmIndex].layout);
  const showThumb = useAppSelector(
    (state) => state.fileManager[fmIndex].showThumb,
  );
  const pageSize = useAppSelector(
    (state) => state.fileManager[fmIndex].pageSize,
  );
  const galleryWidth = useAppSelector(
    (state) => state.fileManager[fmIndex].galleryWidth,
  );
  const listViewColumns = useAppSelector(
    (state) => state.fileManager[fmIndex].listViewColumns,
  );
  
  const [syncViewPreferences, setSyncViewPreferences] = React.useState(false);
  
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

  const options = useMemo(() => {
    if (!orderMethodOptions || !orderDirectionOption) return [];
    const res: sortOption[] = [];
    const selectedVal =
      !sortBy || !sortDirection
        ? "created_at_asc"
        : `${sortBy}_${sortDirection}`;
    orderMethodOptions.forEach((method) => {
      orderDirectionOption.forEach((direction) => {
        const key = `${method}_${direction}`;
        if (supportOption[key]) {
          res.push({ ...supportOption[key], selected: key == selectedVal });
        }
      });
    });
    return res;
  }, [orderMethodOptions, orderDirectionOption, sortBy, sortDirection]);

  const selectOption = (option: sortOption) => {
    dispatch(
      changeSortOption(fmIndex, option.order_by, option.order_direction),
    );
    SessionManager.set(UserSettings.SortBy, option.order_by);
    SessionManager.set(UserSettings.SortDirection, option.order_direction);
    
    // Save to cloud if sync is enabled
    saveViewPreferencesToCloud(path || "/", {
      layout: layout || "grid",
      show_thumb: showThumb,
      sort_by: option.order_by,
      sort_direction: option.order_direction,
      page_size: pageSize,
      gallery_width: galleryWidth,
      list_columns: JSON.stringify(listViewColumns),
    });
    
    onClose && onClose({}, "escapeKeyDown");
  };

  return (
    <Menu onClose={onClose} {...rest}>
      {options.map((option) => (
        <MenuItem
          dense
          key={option.order_by + option.order_direction}
          onClick={() => selectOption(option)}
        >
          {!option.selected && (
            <ListItemText inset>{t(option.label)}</ListItemText>
          )}
          {option.selected && (
            <>
              <ListItemIcon>
                <Checkmark />
              </ListItemIcon>
              {t(option.label)}
            </>
          )}
        </MenuItem>
      ))}
    </Menu>
  );
};

export default SortMethodMenu;
