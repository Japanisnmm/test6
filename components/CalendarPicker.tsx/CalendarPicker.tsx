"use client";
import {
  type DateSegment,
  type DateFieldState,
} from "@react-stately/datepicker";
import {
  AriaTimeFieldProps,
  TimeValue,
  useDateSegment,
  useTimeField,
} from "@react-aria/datepicker";
import {
  ComponentProps,
  ComponentRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { tv, type VariantProps } from "tailwind-variants";
import { Button } from "../ui/button";
import { Calendar as CalendarPrimitive, type Matcher } from "../ui/calendar";
import { RiArrowDownSLine, RiSubtractFill } from "@remixicon/react";
import { format, type Locale } from "date-fns";
import { enUS } from "date-fns/locale";
import { useTimeFieldState } from "@react-stately/datepicker";
import * as PopoverPrimitives from "@radix-ui/react-popover";
import { Time } from "@internationalized/date";
import { EventIcon } from "../icons/EventIcon";

//type and interface
type TimeSegmentProps = {
  segment: DateSegment;
  state: DateFieldState;
};

type TimeInputProps = Omit<
  AriaTimeFieldProps<TimeValue>,
  "label" | "shouldForceLeadingZeros" | "description" | "errorMessage"
>;

type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

type PresetContainerProps<TPreset extends IPreset, TValue> = {
  presets: TPreset[];
  onSelect: (value: TValue) => void;
  currentValue?: TValue;
};

type CalendarProps = {
  fromYear?: number;
  toYear?: number;
  fromMonth?: Date;
  toMonth?: Date;
  fromDay?: Date;
  toDay?: Date;
  fromDate?: Date;
  toDate?: Date;
  locale?: Locale;
};

type Translations = {
  cancel?: string;
  apply?: string;
  start?: string;
  end?: string;
  range?: string;
  reset?: string;
};

interface ITriggerProps
  extends ComponentProps<"button">,
    VariantProps<typeof triggerStyles> {
  placeholder?: string;
  isOpen?: boolean;
}

interface IPreset {
  label: string;
}

interface IDatePreset extends IPreset {
  date: Date;
}

interface IDateRangePreset extends IPreset {
  dateRange: DateRange;
}

interface IPickerProps extends CalendarProps {
  className?: string;
  disabled?: boolean;
  disabledDays?: Matcher | Matcher[] | undefined;
  required?: boolean;
  showTimePicker?: boolean;
  placeholder?: string;
  enableYearNavigation?: boolean;
  disableNavigation?: boolean;
  hasError?: boolean;
  id?: string;
  // Customize the date picker for different languages.
  translations?: Translations;
  align?: "center" | "end" | "start";
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-required"?: boolean;
}

interface IRangeProps extends IPickerProps {
  presets?: IDateRangePreset[];
  defaultValue?: DateRange;
  value?: DateRange;
  onChange?: (dateRange: DateRange | undefined) => void;
  onBlur?: () => void;
  name?: string;
}

//Region Style
const focusInput = [
  // base
  "focus:ring-2",
  // ring color
  "focus:ring-blue-200 dark:focus:ring-blue-700/30",
  // border color
  "focus:border-blue-500 dark:focus:border-blue-700",
];

const hasErrorInput = [
  // base
  "ring-2",
  // border color
  "border-red-500 dark:border-red-700",
  // ring color
  "ring-red-200 dark:ring-red-700/30",
];

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-blue-500 dark:outline-blue-500",
];

const triggerStyles = tv({
  base: [
    // base
    "flex items-center overflow-hidden",
    "rounded-xl",
    // dimensions
    "w-[214px] h-8",
    // padding
    "px-2 py-3",
    // gap
    "gap-1",
    // text size
    "text-sm",
    // background color
    "bg-[#ECFBFA] dark:bg-gray-950",
    // border color
    "border border-[#00918A]",
    // text color
    "text-[#00918A]",
    // placeholder color
    "placeholder-[#00918A]",
    // hover
    "hover:bg-[#ECFBFA] dark:hover:bg-gray-950/50",
    // disabled
    "disabled:pointer-events-none",
    "disabled:bg-gray-100 disabled:text-gray-400",
    "dark:disabled:border-gray-800 dark:disabled:bg-gray-800 dark:disabled:text-gray-500",
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
  },
});

// Region TimeInput
const isBrowserLocaleClockType24h = () => {
  const language =
    typeof window !== "undefined" ? window.navigator.language : "en-US";
  const hr = new Intl.DateTimeFormat(language, {
    hour: "numeric",
  }).format();

  return Number.isInteger(Number(hr));
};

const TimeSegment = ({ segment, state }: TimeSegmentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { segmentProps } = useDateSegment(segment, state, ref);
  //// Skip rendering for any non-editable segments except colon
  if (
    !segment.isEditable &&
    segment.type === "literal" &&
    segment.text !== ":"
  ) {
    return null;
  }

  return (
    <div
      {...segmentProps}
      ref={ref}
      className={cn(
        "relative block w-full appearance-none rounded-md border px-2.5 py-1.5 text-left uppercase tabular-nums shadow-xs outline-hidden transition sm:text-sm",
        // border color
        "border-gray-300 dark:border-gray-800",
        // text color
        "text-gray-900 dark:text-gray-50",
        // background color
        "bg-white dark:bg-gray-950",
        // focus
        focusInput,
        // invalid (optional)
        "group-aria-invalid/time-input:border-red-500 group-aria-invalid/time-input:ring-2 group-aria-invalid/time-input:ring-red-200 invalid:border-red-500 invalid:ring-2 invalid:ring-red-200 dark:group-aria-invalid/time-input:ring-red-400/20",
        {
          "w-fit! border-none bg-transparent px-0 text-gray-400 shadow-none":
            segment.type === "literal",
          "border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500":
            state.isDisabled && segment.text !== ":",
        }
      )}
    >
      {segment.isPlaceholder ? segment.placeholder : segment.text}
    </div>
  );
};

const TimeInput = forwardRef<HTMLDivElement, TimeInputProps>(
  ({ hourCycle, ...props }: TimeInputProps, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      ref,
      () => innerRef?.current
    );

    const locale = window !== undefined ? window.navigator.language : "en-US";

    const state = useTimeFieldState({
      hourCycle: hourCycle,
      locale: locale,
      shouldForceLeadingZeros: true,
      autoFocus: true,
      ...props,
    });

    const { fieldProps } = useTimeField(
      {
        ...props,
        hourCycle: hourCycle,
        shouldForceLeadingZeros: true,
      },
      state,
      innerRef
    );

    return (
      <div
        {...fieldProps}
        ref={innerRef}
        className="group/time-input inline-flex w-full gap-x-2"
      >
        {state.segments.map((segment, i) => (
          <TimeSegment key={i} segment={segment} state={state} />
        ))}
      </div>
    );
  }
);
TimeInput.displayName = "TimeInput";

// Region Trigger
const Trigger = forwardRef<HTMLButtonElement, ITriggerProps>(
  (
    {
      className,
      children,
      placeholder,
      hasError,
      isOpen,
      ...props
    }: ITriggerProps,
    forwardedRef
  ) => {
    return (
      <PopoverPrimitives.Trigger asChild>
        <button
          ref={forwardedRef}
          className={cn(triggerStyles({ hasError }), className)}
          {...props}
        >
          <EventIcon width={20} height={20} />
          <span className="flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap text-[#00918A] text-sm font-semibold">
            {children ? (
              children
            ) : placeholder ? (
              <span className="text-[#00918A]">{placeholder}</span>
            ) : null}
          </span>
          <RiArrowDownSLine
            className={cn(
              "size-5 text-[#00918A] transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverPrimitives.Trigger>
    );
  }
);

Trigger.displayName = "DatePicker.Trigger";

//Region Popover
const CalendarPopover = forwardRef<
  ComponentRef<typeof PopoverPrimitives.Content>,
  ComponentProps<typeof PopoverPrimitives.Content>
>(({ align, className, children, ...props }, forwardedRef) => {
  return (
    <PopoverPrimitives.Portal>
      <PopoverPrimitives.Content
        ref={forwardedRef}
        sideOffset={10}
        side="bottom"
        align={align}
        avoidCollisions
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          // base
          "relative z-50 w-fit rounded-md border text-sm shadow-xl shadow-black/[2.5%]",
          // widths
          "max-w-[95vw] min-w-[calc(var(--radix-select-trigger-width)-2px)]",
          // border color
          "border-gray-200 dark:border-gray-800",
          // background color
          "bg-white dark:bg-gray-950",
          // transition
          "will-change-[transform,opacity]",
          "data-[state=closed]:animate-hide",
          "data-[state=open]:data-[side=bottom]:animate-slide-down-and-fade data-[state=open]:data-[side=left]:animate-slide-left-and-fade data-[state=open]:data-[side=right]:animate-slide-right-and-fade data-[state=open]:data-[side=top]:animate-slide-up-and-fade",
          className
        )}
        {...props}
      >
        {children}
      </PopoverPrimitives.Content>
    </PopoverPrimitives.Portal>
  );
});

CalendarPopover.displayName = "DatePicker.CalendarPopover";

// Region Preset
const PresetContainer = <TPreset extends IPreset, TValue>({
  // Available preset configurations
  presets,
  // Event handler when a preset is selected
  onSelect,
  // Currently selected preset
  currentValue,
}: PresetContainerProps<TPreset, TValue>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isDateRangePresets = (preset: any): preset is IDateRangePreset => {
    return "dateRange" in preset;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isDatePresets = (preset: any): preset is IDatePreset => {
    return "date" in preset;
  };

  const handleClick = (preset: TPreset) => {
    if (isDateRangePresets(preset)) {
      onSelect(preset.dateRange as TValue);
    } else if (isDatePresets(preset)) {
      onSelect(preset.date as TValue);
    }
  };

  const compareDates = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const compareRanges = (range1: DateRange, range2: DateRange) => {
    const from1 = range1.from;
    const from2 = range2.from;

    let equalFrom = false;

    if (from1 && from2) {
      const sameFrom = compareDates(from1, from2);

      if (sameFrom) {
        equalFrom = true;
      }
    }

    const to1 = range1.to;
    const to2 = range2.to;

    let equalTo = false;

    if (to1 && to2) {
      const sameTo = compareDates(to1, to2);

      if (sameTo) {
        equalTo = true;
      }
    }

    return equalFrom && equalTo;
  };

  const matchesCurrent = (preset: TPreset) => {
    if (isDateRangePresets(preset)) {
      const value = currentValue as DateRange | undefined;

      return value && compareRanges(value, preset.dateRange);
    }
    if (isDatePresets(preset)) {
      const value = currentValue as Date | undefined;

      return value && compareDates(value, preset.date);
    }

    return false;
  };

  return (
    <div>
      <h2 className="px-2.5 py-1.5 text-[#00746E] font-bold">เลือกวัน</h2>
      <ul className="flex items-start gap-x-2 sm:flex-col">
        {presets.map((preset) => {
          return (
            <li key={`preset-${preset.label}`} className="sm:w-full sm:py-px">
              <button
                type="button"
                title={preset.label}
                className={cn(
                  // base
                  "relative w-full overflow-hidden rounded-sm border px-2.5 py-1.5 text-left text-base text-ellipsis whitespace-nowrap shadow-xs outline-hidden transition-all sm:border-none sm:py-2 sm:text-sm sm:shadow-none",
                  // text color
                  "text-gray-700 dark:text-gray-300",
                  // border color
                  "border-gray-200 dark:border-gray-800",
                  // focus
                  focusRing,
                  // background color

                  {
                    "text-[#00918A] text-base": matchesCurrent(preset),
                  }
                )}
                onClick={() => handleClick(preset)}
                aria-label={`Select ${preset.label}`}
              >
                <span>{preset.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

PresetContainer.displayName = "DatePicker.PresetContainer";

//Region Date Picker Shared
const formatDate = (
  date: Date,
  locale: Locale,
  includeTime?: boolean
): string => {
  const usesAmPm = !isBrowserLocaleClockType24h();
  const buddhistYear = (date.getFullYear() + 543).toString().slice(-2);

  let dateString: string;

  if (includeTime) {
    const timeFormat = usesAmPm ? "h:mm a" : "HH:mm";
    const dayMonth = format(date, "dd MMM", { locale });
    dateString = `${dayMonth}, ${buddhistYear} ${format(date, timeFormat, {
      locale,
    })}`;
  } else {
    const dayMonth = format(date, "dd MMM", { locale });
    dateString = `${dayMonth} ${buddhistYear}`;
  }

  return dateString;
};

const formatInputDate = (date: Date, locale: Locale): string => {
  const buddhistYear = date.getFullYear() + 543;
  const dayMonth = format(date, "d MMM", { locale });
  return `${dayMonth} ${buddhistYear}`;
};

//Region Range date
const RangeDatePicker = ({
  defaultValue,
  value,
  onChange,
  onBlur,
  name,
  presets,
  disabled,
  disableNavigation,
  disabledDays,
  enableYearNavigation = false,
  locale = enUS,
  showTimePicker,
  placeholder,
  hasError,
  translations,
  align = "center",
  className,
  ...props
}: IRangeProps) => {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    value ?? defaultValue
  );
  const [month, setMonth] = useState<Date | undefined>(() => {
    const currentDate = range?.from || new Date();
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    return previousMonth;
  });
  const [hasUserSelectedRange, setHasUserSelectedRange] = useState(false);
  const [editMode, setEditMode] = useState<"none" | "start" | "end">("none");
  const [tempRange, setTempRange] = useState<DateRange | undefined>(range);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);
  const [startInputValue, setStartInputValue] = useState<Date | undefined>(
    () => {
      return range?.from;
    }
  );

  const [endInputValue, setEndInputValue] = useState<Date | undefined>(() => {
    return range?.to;
  });

  const [startTime, setStartTime] = useState<TimeValue | null>(
    value?.from
      ? new Time(value.from.getHours(), value.from.getMinutes())
      : defaultValue?.from
      ? new Time(defaultValue.from.getHours(), defaultValue.from.getMinutes())
      : new Time(0, 0)
  );
  const [endTime, setEndTime] = useState<TimeValue | null>(
    value?.to
      ? new Time(value.to.getHours(), value.to.getMinutes())
      : defaultValue?.to
      ? new Time(defaultValue.to.getHours(), defaultValue.to.getMinutes())
      : new Time(0, 0)
  );

  const combinedDisabledDays = useMemo(() => {
    const disabledMatchers: Matcher[] = [];

    if (disabledDays) {
      if (Array.isArray(disabledDays)) {
        disabledMatchers.push(...disabledDays);
      } else {
        disabledMatchers.push(disabledDays);
      }
    }

    if (editMode === "none" && hasUserSelectedRange && !isSelectingEndDate) {
      disabledMatchers.push({
        before: new Date(9999, 11, 31), // Disable ทุกวัน
      });
    }

    if (editMode === "end" && tempRange?.from) {
      disabledMatchers.push({
        before: tempRange.from,
      });
    }

    return disabledMatchers;
  }, [
    disabledDays,
    tempRange?.from,
    editMode,
    hasUserSelectedRange,
    isSelectingEndDate,
  ]);

  useEffect(() => {
    setRange(value ?? defaultValue);
    setTempRange(value ?? defaultValue);

    setStartTime(
      value?.from
        ? new Time(value.from.getHours(), value.from.getMinutes())
        : defaultValue?.from
        ? new Time(defaultValue.from.getHours(), defaultValue.from.getMinutes())
        : new Time(0, 0)
    );
    setEndTime(
      value?.to
        ? new Time(value.to.getHours(), value.to.getMinutes())
        : defaultValue?.to
        ? new Time(defaultValue.to.getHours(), defaultValue.to.getMinutes())
        : new Time(0, 0)
    );
    setStartInputValue(value?.from ?? defaultValue?.from);
    setEndInputValue(value?.to ?? defaultValue?.to);
  }, [value, defaultValue]);

  const setMonthToPreviousMonth = (date: Date | undefined) => {
    if (date) {
      const previousMonth = new Date(date);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      setMonth(previousMonth);
    }
  };

  useEffect(() => {
    if (!open) {
      if (range?.from) {
        setMonthToPreviousMonth(range.from);
      } else {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - 1);
        setMonth(currentDate);
      }
      setEditMode("none");
    } else {
      setStartInputValue(range?.from);
      setEndInputValue(range?.to);
      setTempRange(range);
      setHasUserSelectedRange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const onRangeChange = (newRange: DateRange | undefined) => {
    if (editMode === "start") {
      if (!newRange) {
        setEditMode("end");
        setIsSelectingEndDate(false);
        if (range?.to) {
          setMonthToPreviousMonth(range.to);
        }
        return;
      }

      const isFromSameAsCurrentStart =
        range?.from &&
        newRange.from &&
        newRange.from.getDate() === range.from.getDate() &&
        newRange.from.getMonth() === range.from.getMonth() &&
        newRange.from.getFullYear() === range.from.getFullYear();

      const selectedDate = isFromSameAsCurrentStart
        ? newRange.to
        : newRange.from;

      if (selectedDate) {
        const newEndDate =
          range?.to && selectedDate > range.to ? selectedDate : range?.to;

        const updatedRange = {
          from: selectedDate,
          to: newEndDate,
        };

        setRange(updatedRange);
        setTempRange(updatedRange);
        setStartInputValue(selectedDate);
        setEndInputValue(newEndDate);
        setIsSelectingEndDate(false);
        setEditMode("end");

        if (newEndDate) {
          setMonthToPreviousMonth(newEndDate);
        }
        return;
      }
    }

    if (editMode === "end") {
      if (!newRange) {
        const updatedRange = {
          from: tempRange?.from || range?.from,
          to: tempRange?.from || range?.from,
        };

        setRange(updatedRange);
        setTempRange(updatedRange);
        setEndInputValue(tempRange?.from || range?.from);
        setIsSelectingEndDate(false);
        setEditMode("none");
        return;
      }

      const selectedDate = newRange.to || newRange.from;

      if (selectedDate) {
        const updatedRange = {
          from: tempRange?.from || range?.from,
          to: selectedDate,
        };
        setRange(updatedRange);
        setTempRange(updatedRange);
        setEndInputValue(selectedDate);
        setIsSelectingEndDate(false);
        setEditMode("none");
        return;
      }
    }

    if (editMode === "none" && isSelectingEndDate) {
      if (!newRange) {
        const updatedRange = {
          from: range?.from,
          to: range?.from,
        };

        setRange(updatedRange);
        setTempRange(updatedRange);
        setEndInputValue(range?.from);
        setIsSelectingEndDate(false);
        setHasUserSelectedRange(true);
        return;
      }

      const isSameDay =
        range?.from &&
        newRange.to &&
        newRange.to.getDate() === range.from.getDate() &&
        newRange.to.getMonth() === range.from.getMonth() &&
        newRange.to.getFullYear() === range.from.getFullYear();

      if (isSameDay) {
        const updatedRange = {
          from: range.from,
          to: newRange.to,
        };

        setRange(updatedRange);
        setTempRange(updatedRange);
        setEndInputValue(newRange.to);
        setIsSelectingEndDate(false);
        setHasUserSelectedRange(true);
        return;
      }

      const selectedEndDate = newRange.to || newRange.from;

      const updatedRange = {
        from: range?.from,
        to: selectedEndDate,
      };

      setRange(updatedRange);
      setTempRange(updatedRange);
      setEndInputValue(selectedEndDate);
      setIsSelectingEndDate(false);
      setHasUserSelectedRange(true);
      return;
    }

    if (!newRange) return;

    if (
      editMode === "none" &&
      !isSelectingEndDate &&
      !hasUserSelectedRange &&
      newRange?.from
    ) {
      const isSameDay =
        newRange.from &&
        newRange.to &&
        newRange.from.getDate() === newRange.to.getDate() &&
        newRange.from.getMonth() === newRange.to.getMonth() &&
        newRange.from.getFullYear() === newRange.to.getFullYear();

      if (isSameDay) {
        const updatedRange = {
          from: newRange.from,
          to: newRange.to,
        };

        setRange(updatedRange);
        setTempRange(updatedRange);
        setStartInputValue(newRange.from);
        setEndInputValue(newRange.to);
        setHasUserSelectedRange(true);
        setIsSelectingEndDate(false);

        return;
      }

      const isClickingInsideExistingRange =
        range?.from &&
        newRange.from &&
        newRange.from.getTime() === range.from.getTime() &&
        newRange.to;

      const startDate = isClickingInsideExistingRange
        ? newRange.to!
        : newRange.from;

      const today = new Date();

      const updatedRange = {
        from: startDate,
        to: today,
      };

      setRange(updatedRange);
      setTempRange(updatedRange);
      setStartInputValue(startDate);
      setEndInputValue(today);
      setHasUserSelectedRange(true);
      setIsSelectingEndDate(true);
      setMonthToPreviousMonth(today);

      return;
    }

    if (showTimePicker) {
      if (newRange?.from && !startTime) {
        setStartTime(new Time(0, 0));
      }

      if (newRange?.to && !endTime) {
        setEndTime(new Time(0, 0));
      }

      if (newRange?.from && startTime) {
        newRange.from.setHours(startTime.hour);
        newRange.from.setMinutes(startTime.minute);
      }

      if (newRange?.to && endTime) {
        newRange.to.setHours(endTime.hour);
        newRange.to.setMinutes(endTime.minute);
      }
    }

    setRange(newRange);
    setTempRange(newRange);
    setStartInputValue(newRange.from);
    setEndInputValue(newRange.to);
    setHasUserSelectedRange(true);
    setIsSelectingEndDate(false);
  };

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }

    setOpen(open);
  };

  const onTimeChange = (time: TimeValue | null, pos: "start" | "end") => {
    switch (pos) {
      case "start":
        setStartTime(time);
        break;
      case "end":
        setEndTime(time);
        break;
    }

    if (!range) {
      return;
    }

    if (pos === "start") {
      if (!range.from) {
        return;
      }

      const newDate = new Date(range.from.getTime());

      if (!time) {
        newDate.setHours(0);
        newDate.setMinutes(0);
      } else {
        newDate.setHours(time.hour);
        newDate.setMinutes(time.minute);
      }

      setRange({
        ...range,
        from: newDate,
      });
    }

    if (pos === "end") {
      if (!range.to) {
        return;
      }

      const newDate = new Date(range.to.getTime());

      if (!time) {
        newDate.setHours(0);
        newDate.setMinutes(0);
      } else {
        newDate.setHours(time.hour);
        newDate.setMinutes(time.minute);
      }

      setRange({
        ...range,
        to: newDate,
      });
    }
  };

  const displayRange = useMemo(() => {
    const rangeToDisplay = editMode !== "none" ? tempRange : range;
    if (!rangeToDisplay) {
      return null;
    }

    return `${
      rangeToDisplay.from
        ? formatDate(rangeToDisplay.from, locale, showTimePicker)
        : ""
    } - ${
      rangeToDisplay.to
        ? formatDate(rangeToDisplay.to, locale, showTimePicker)
        : ""
    }`;
  }, [range, tempRange, editMode, locale, showTimePicker]);

  const onApply = () => {
    const finalRange = editMode !== "none" ? tempRange : range;
    setRange(finalRange);
    setTempRange(finalRange);
    setStartInputValue(finalRange?.from);
    setEndInputValue(finalRange?.to);
    setEditMode("none");
    setIsSelectingEndDate(false);
    setOpen(false);
    onChange?.(finalRange);
    onBlur?.();
  };

  const onCancel = () => {
    setRange(defaultValue);
    setTempRange(defaultValue);
    setStartInputValue(defaultValue?.from);
    setEndInputValue(defaultValue?.to);
    setStartTime(
      defaultValue?.from
        ? new Time(defaultValue.from.getHours(), defaultValue.from.getMinutes())
        : new Time(0, 0)
    );
    setEndTime(
      defaultValue?.to
        ? new Time(defaultValue.to.getHours(), defaultValue.to.getMinutes())
        : new Time(0, 0)
    );
    setEditMode("none");
    setIsSelectingEndDate(false);
    setHasUserSelectedRange(false);
    setOpen(false);
    onBlur?.();
  };

  const onReset = () => {
    setRange(defaultValue);
    setTempRange(defaultValue);
    setStartInputValue(defaultValue?.from);
    setEndInputValue(defaultValue?.to);
    setEditMode("none");
    setHasUserSelectedRange(false);
    setIsSelectingEndDate(false);
    setMonthToPreviousMonth(defaultValue?.from);
  };

  const onStartDateClick = () => {
    setEditMode("start");
    setTempRange(range);
    setIsSelectingEndDate(false);
    if (range?.from) {
      setMonthToPreviousMonth(range.from);
    }
  };

  const onEndDateClick = () => {
    setEditMode("end");
    setTempRange(range);
    setIsSelectingEndDate(false);
    if (range?.to) {
      setMonthToPreviousMonth(range.to);
    }
  };

  const defaultPlaceholder = useMemo(() => {
    if (!defaultValue?.from || !defaultValue?.to) {
      return "";
    }
    const formattedStart = formatDate(defaultValue.from, locale);
    const formattedEnd = formatDate(defaultValue.to, locale);
    return `${formattedStart} - ${formattedEnd}`;
  }, [defaultValue, locale]);

  const setMonthByRange = (fromDate: Date, toDate: Date) => {
    const monthsDiff =
      (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
      (toDate.getMonth() - fromDate.getMonth());

    if (monthsDiff >= 1) {
      setMonth(new Date(fromDate));
    } else {
      setMonthToPreviousMonth(fromDate);
    }
  };
  const finalPlaceholder = placeholder ?? defaultPlaceholder;

  return (
    <PopoverPrimitives.Root open={open} onOpenChange={onOpenChange}>
      <Trigger
        placeholder={finalPlaceholder}
        disabled={disabled}
        className={className}
        hasError={hasError}
        isOpen={open}
        aria-required={props.required || props["aria-required"]}
        aria-invalid={props["aria-invalid"]}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        name={name}
      >
        {displayRange}
      </Trigger>
      <CalendarPopover align={align}>
        <div className="flex">
          <div className="flex flex-col overflow-x-auto sm:flex-row sm:items-start">
            {presets && presets.length > 0 && (
              <div
                className={cn(
                  "relative flex h-16 w-full items-center sm:h-full sm:w-40",
                  "overflow-auto"
                )}
              >
                <div className="absolute px-3 sm:inset-0 sm:left-0 sm:p-2">
                  <PresetContainer
                    currentValue={range}
                    presets={presets}
                    onSelect={(newRange) => {
                      setRange(newRange);
                      setTempRange(newRange);
                      setStartInputValue(newRange?.from);
                      setEndInputValue(newRange?.to);
                      setEditMode("start");
                      setHasUserSelectedRange(true);
                      setIsSelectingEndDate(false);
                      if (newRange?.from && newRange?.to) {
                        setMonthByRange(newRange.from, newRange.to);
                      }
                    }}
                  />
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 p-3">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10 flex-1 text-sm rounded-xl justify-between bg-white hover:bg-white !border-[#000000]",
                    editMode === "start"
                      ? " !border-[#000000]"
                      : editMode === "none" &&
                        !hasUserSelectedRange &&
                        !isSelectingEndDate
                      ? " !border-[#000000]"
                      : " !border-[#CFD3D2]"
                  )}
                  onClick={onStartDateClick}
                >
                  <span className="text-gray-900">
                    {(editMode !== "none" ? tempRange?.from : startInputValue)
                      ? formatInputDate(
                          (editMode !== "none"
                            ? tempRange?.from
                            : startInputValue)!,
                          locale
                        )
                      : defaultValue?.from
                      ? formatInputDate(defaultValue.from, locale)
                      : ""}
                  </span>
                  <EventIcon width={24} height={24} color="black" />
                </Button>
                <span className="mx-2 text-black">&rarr;</span>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10 flex-1 text-sm rounded-xl justify-between bg-white hover:bg-white",
                    editMode === "end" || isSelectingEndDate
                      ? " !border-[#000000]"
                      : " !border-[#CFD3D2]"
                  )}
                  onClick={onEndDateClick}
                >
                  <span className="text-gray-900">
                    {(editMode !== "none" ? tempRange?.to : endInputValue)
                      ? formatInputDate(
                          (editMode !== "none"
                            ? tempRange?.to
                            : endInputValue)!,
                          locale
                        )
                      : defaultValue?.to
                      ? formatInputDate(defaultValue.to, locale)
                      : ""}
                  </span>
                  <EventIcon width={24} height={24} color="black" />
                </Button>
              </div>
              <CalendarPrimitive
                mode="range"
                selected={editMode !== "none" ? tempRange : range}
                onSelect={onRangeChange}
                month={month}
                onMonthChange={setMonth}
                numberOfMonths={2}
                disabled={combinedDisabledDays}
                disableNavigation={disableNavigation}
                enableYearNavigation={enableYearNavigation}
                locale={locale}
                initialFocus
                classNames={{
                  months: "flex flex-row overflow-x-auto",
                }}
                {...props}
              />
              {showTimePicker && (
                <div className="flex items-center justify-evenly gap-x-3 border-t border-gray-200 p-3 dark:border-gray-800">
                  <div className="flex flex-1 items-center gap-x-2">
                    <span className="dark:text-gray-30 text-gray-700">
                      {translations?.start ?? "Start"}:
                    </span>
                    <TimeInput
                      value={startTime}
                      onChange={(v) => onTimeChange(v, "start")}
                      aria-label="Start date time"
                      isDisabled={!range?.from}
                      isRequired={props.required}
                    />
                  </div>
                  <RiSubtractFill className="size-4 shrink-0 text-gray-400" />
                  <div className="flex flex-1 items-center gap-x-2">
                    <span className="dark:text-gray-30 text-gray-700">
                      {translations?.end ?? "End"}:
                    </span>
                    <TimeInput
                      value={endTime}
                      onChange={(v) => onTimeChange(v, "end")}
                      aria-label="End date time"
                      isDisabled={!range?.to}
                      isRequired={props.required}
                    />
                  </div>
                </div>
              )}
              <div className=" p-3 sm:flex sm:items-center sm:justify-end">
                <div className="mt-2 flex items-center gap-x-2 sm:mt-0">
                  <Button
                    variant="ghost"
                    className="h-10 w-[72px] rounded-[8px] text-[#00918A] font-semibold sm:w-fit"
                    type="button"
                    onClick={onReset}
                  >
                    {translations?.reset ?? "Clear"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-[72px] rounded-[8px] border-[#CFD3D2] sm:w-fit"
                    type="button"
                    onClick={onCancel}
                  >
                    {translations?.cancel ?? "Cancel"}
                  </Button>
                  <Button
                    variant="default"
                    className="h-10 w-[72px] rounded-[8px] sm:w-fit"
                    type="button"
                    onClick={onApply}
                  >
                    {translations?.apply ?? "Apply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CalendarPopover>
    </PopoverPrimitives.Root>
  );
};

//Region PresetValidation
const validatePresets = (
  presets: IDateRangePreset[] | IDatePreset[],
  rules: IPickerProps
) => {
  const { toYear, fromYear, fromMonth, toMonth, fromDay, toDay } = rules;

  if (presets && presets.length > 0) {
    const fromYearToUse = fromYear;
    const toYearToUse = toYear;

    for (const preset of presets) {
      if ("date" in preset) {
        const presetYear = preset.date.getFullYear();

        if (fromYear && presetYear < fromYear) {
          throw new Error(
            `Preset ${preset.label} is before fromYear ${fromYearToUse}.`
          );
        }

        if (toYear && presetYear > toYear) {
          throw new Error(
            `Preset ${preset.label} is after toYear ${toYearToUse}.`
          );
        }

        if (fromMonth) {
          const presetMonth = preset.date.getMonth();

          if (presetMonth < fromMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label} is before fromMonth ${fromMonth}.`
            );
          }
        }

        if (toMonth) {
          const presetMonth = preset.date.getMonth();

          if (presetMonth > toMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label} is after toMonth ${toMonth}.`
            );
          }
        }

        if (fromDay) {
          const presetDay = preset.date.getDate();

          if (presetDay < fromDay.getDate()) {
            throw new Error(
              `Preset ${preset.label} is before fromDay ${fromDay}.`
            );
          }
        }

        if (toDay) {
          const presetDay = preset.date.getDate();

          if (presetDay > toDay.getDate()) {
            throw new Error(
              `Preset ${preset.label} is after toDay ${format(
                toDay,
                "MMM dd, yyyy"
              )}.`
            );
          }
        }
      }

      if ("dateRange" in preset) {
        const presetFromYear = preset.dateRange.from?.getFullYear();
        const presetToYear = preset.dateRange.to?.getFullYear();

        if (presetFromYear && fromYear && presetFromYear < fromYear) {
          throw new Error(
            `Preset ${preset.label}'s 'from' is before fromYear ${fromYearToUse}.`
          );
        }

        if (presetToYear && toYear && presetToYear > toYear) {
          throw new Error(
            `Preset ${preset.label}'s 'to' is after toYear ${toYearToUse}.`
          );
        }

        if (fromMonth) {
          const presetMonth = preset.dateRange.from?.getMonth();

          if (presetMonth && presetMonth < fromMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label}'s 'from' is before fromMonth ${format(
                fromMonth,
                "MMM, yyyy"
              )}.`
            );
          }
        }

        if (toMonth) {
          const presetMonth = preset.dateRange.to?.getMonth();

          if (presetMonth && presetMonth > toMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label}'s 'to' is after toMonth ${format(
                toMonth,
                "MMM, yyyy"
              )}.`
            );
          }
        }

        if (fromDay) {
          const presetDay = preset.dateRange.from?.getDate();

          if (presetDay && presetDay < fromDay.getDate()) {
            throw new Error(
              `Preset ${
                preset.dateRange.from
              }'s 'from' is before fromDay ${format(fromDay, "MMM dd, yyyy")}.`
            );
          }
        }

        if (toDay) {
          const presetDay = preset.dateRange.to?.getDate();

          if (presetDay && presetDay > toDay.getDate()) {
            throw new Error(
              `Preset ${preset.label}'s 'to' is after toDay ${format(
                toDay,
                "MMM dd, yyyy"
              )}.`
            );
          }
        }
      }
    }
  }
};

type RangeDatePickerProps = {
  presets?: IDateRangePreset[];
  defaultValue?: DateRange;
  value?: DateRange;
  onChange?: (dateRange: DateRange | undefined) => void;
  onBlur?: () => void;
  name?: string;
} & IPickerProps;

const DateRangePicker = ({ presets, ...props }: RangeDatePickerProps) => {
  if (presets) {
    validatePresets(presets, props);
  }

  return <RangeDatePicker presets={presets} {...(props as IRangeProps)} />;
};

DateRangePicker.displayName = "DateRangePicker";

export {
  DateRangePicker,
  type IDatePreset,
  type IDateRangePreset,
  type DateRange,
};
