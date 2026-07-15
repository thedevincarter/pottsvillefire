"use client";

import { useState } from "react";
import { Combobox, InputBase, useCombobox } from "@mantine/core";

type Props = {
  label: string;
  placeholder?: string;
  data: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  clearable?: boolean;
};

export function CreatableSelect({
  label,
  placeholder,
  data,
  value,
  onChange,
  clearable,
}: Props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState(data);

  const filtered = options.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase().trim())
  );

  const exactMatch = options.some(
    (item) => item.toLowerCase() === search.toLowerCase().trim()
  );

  const items = filtered.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === "$create") {
          setOptions((prev) => [...prev, search]);
          onChange(search);
        } else {
          onChange(val);
        }
        setSearch("");
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          rightSection={
            clearable && value ? (
              <Combobox.ClearButton
                onClear={() => {
                  onChange(null);
                  setSearch("");
                }}
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          rightSectionPointerEvents={clearable && value ? "all" : "none"}
          value={search || value || ""}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch("");
          }}
          placeholder={placeholder}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {items}
          {!exactMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">
              + Create &quot;{search}&quot;
            </Combobox.Option>
          )}
          {filtered.length === 0 && search.trim().length === 0 && (
            <Combobox.Empty>No options</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
