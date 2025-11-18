"use client";

import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { addYears, format, isSameMonth } from "date-fns";
import {
  DayPicker,
  useDayPicker,
  useDayRender,
  useNavigation,
  type DayPickerRangeProps,
  type DayPickerSingleProps,
  type DayProps,
  type Matcher,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { focusRing } from "../CalendarPicker.tsx/CalendarPicker";
import { forwardRef, useRef, useState } from "react";

interface NavigationButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
  icon: React.ElementType;
  disabled?: boolean;
}

const NavigationButton = forwardRef<HTMLButtonElement, NavigationButtonProps>(
  (
    { onClick, icon, disabled, ...props }: NavigationButtonProps,
    forwardedRef
  ) => {
    const Icon = icon;
    return (
      <button
        ref={forwardedRef}
        type="button"
        disabled={disabled}
        className={cn(
          "flex size-8 shrink-0 select-none items-center justify-center rounded-sm p-1 outline-hidden transition sm:size-[30px]",
          // text color
          "text-gray-600 hover:text-gray-800",
          "dark:text-gray-400 dark:hover:text-gray-200",
          // background color
          "dark:hover:bg-gray-900 dark:active:bg-gray-800",
          // disabled
          "disabled:pointer-events-none",
          "disabled:text-gray-400",
          focusRing
        )}
        onClick={onClick}
        {...props}
      >
        <Icon className="size-full shrink-0" />
      </button>
    );
  }
);

NavigationButton.displayName = "NavigationButton";

type OmitKeys<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type KeysToOmit = "showWeekNumber" | "captionLayout" | "mode";

type SingleProps = OmitKeys<DayPickerSingleProps, KeysToOmit>;
type RangeProps = OmitKeys<DayPickerRangeProps, KeysToOmit>;

type CalendarProps =
  | ({
      mode: "single";
    } & SingleProps)
  | ({
      mode?: undefined;
    } & SingleProps)
  | ({
      mode: "range";
    } & RangeProps);

const Calendar = ({
  mode = "single",
  weekStartsOn = 1,
  numberOfMonths = 1,
  enableYearNavigation = false,
  disableNavigation,
  locale,
  className,
  classNames,
  ...props
}: CalendarProps & { enableYearNavigation?: boolean }) => {
  return (
    <DayPicker
      mode={mode}
      weekStartsOn={weekStartsOn}
      numberOfMonths={numberOfMonths}
      locale={locale}
      showOutsideDays={numberOfMonths === 1}
      className={cn(className)}
      classNames={{
        months: "flex space-y-0",
        month: "space-y-4 p-3",
        nav: "gap-1 flex items-center rounded-full size-full justify-between p-4",
        table: "w-full border-collapse space-y-1",
        head_cell:
          "w-9 font-medium text-sm sm:text-xs text-center text-gray-400 dark:text-gray-600 pb-2",
        row: "w-full mt-0.5",
        cell: cn(
          "relative p-0 text-center focus-within:relative",
          "text-gray-900 dark:text-gray-50"
        ),
        day: cn(
          "size-10 rounded-full text-sm focus:z-10",
          "text-gray-900 dark:text-gray-50",
          "disabled:cursor-not-allowed",
          "transition-colors duration-150",
          focusRing
        ),
        day_today: cn(
          "font-semibold",
          "border-2 border-[#00918A]",
          "bg-white dark:bg-white",
          "text-gray-900"
        ),
        day_selected: cn(
          "rounded-sm",
          "aria-selected:bg-[#00918A] aria-selected:text-white",
          "dark:aria-selected:bg-blue-500 dark:aria-selected:text-white",
          "aria-selected:disabled:hover:bg-[#00918A] aria-selected:disabled:hover:text-white",
          "dark:aria-selected:disabled:hover:bg-blue-500 dark:aria-selected:disabled:hover:text-white",
          "aria-selected:disabled:pointer-events-none"
        ),
        day_disabled:
          "text-[#B5BAB9] hover:bg-transparent! dark:hover:bg-transparent! cursor-not-allowed pointer-events-none",
        day_outside: "text-gray-400 dark:text-gray-600",
        day_range_middle: cn(
          "rounded-none!",
          "aria-selected:bg-[#ECFBFA] aria-selected:text-[#00918A]",
          "dark:aria-selected:bg-gray-900! dark:aria-selected:text-gray-50!"
        ),
        day_range_start: "rounded-full ",
        day_range_end: "rounded-full",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => (
          <RiArrowLeftSLine aria-hidden="true" className="size-4" />
        ),
        IconRight: () => (
          <RiArrowRightSLine aria-hidden="true" className="size-4" />
        ),
        Caption: ({ ...props }) => {
          const {
            goToMonth,
            nextMonth,
            previousMonth,
            currentMonth,
            displayMonths,
          } = useNavigation();
          const { numberOfMonths, fromDate, toDate } = useDayPicker();

          const displayIndex = displayMonths.findIndex((month) =>
            isSameMonth(props.displayMonth, month)
          );
          const isFirst = displayIndex === 0;
          const isLast = displayIndex === displayMonths.length - 1;

          const hideNextButton = numberOfMonths > 1 && (isFirst || !isLast);
          const hidePreviousButton = numberOfMonths > 1 && (isLast || !isFirst);

          const goToPreviousYear = () => {
            const targetMonth = addYears(currentMonth, -1);
            if (
              previousMonth &&
              (!fromDate || targetMonth.getTime() >= fromDate.getTime())
            ) {
              goToMonth(targetMonth);
            }
          };

          const goToNextYear = () => {
            const targetMonth = addYears(currentMonth, 1);
            if (
              nextMonth &&
              (!toDate || targetMonth.getTime() <= toDate.getTime())
            ) {
              goToMonth(targetMonth);
            }
          };

          const buddhistYear = props.displayMonth.getFullYear() + 543;
          const monthName = format(props.displayMonth, "LLLL", { locale });

          return (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {enableYearNavigation && !hidePreviousButton && (
                  <NavigationButton
                    disabled={
                      disableNavigation ||
                      !previousMonth ||
                      (fromDate &&
                        addYears(currentMonth, -1).getTime() <
                          fromDate.getTime())
                    }
                    aria-label="Go to previous year"
                    onClick={goToPreviousYear}
                    icon={RiArrowLeftDoubleLine}
                  />
                )}
                {!hidePreviousButton && (
                  <NavigationButton
                    disabled={disableNavigation || !previousMonth}
                    aria-label="Go to previous month"
                    onClick={() => previousMonth && goToMonth(previousMonth)}
                    icon={RiArrowLeftSLine}
                  />
                )}
              </div>

              <div
                role="presentation"
                aria-live="polite"
                className="text-sm font-medium capitalize tabular-nums text-gray-900 dark:text-gray-50"
              >
                {monthName} {buddhistYear}
              </div>

              <div className="flex items-center gap-1">
                {!hideNextButton && (
                  <NavigationButton
                    disabled={disableNavigation || !nextMonth}
                    aria-label="Go to next month"
                    onClick={() => nextMonth && goToMonth(nextMonth)}
                    icon={RiArrowRightSLine}
                  />
                )}
                {enableYearNavigation && !hideNextButton && (
                  <NavigationButton
                    disabled={
                      disableNavigation ||
                      !nextMonth ||
                      (toDate &&
                        addYears(currentMonth, 1).getTime() > toDate.getTime())
                    }
                    aria-label="Go to next year"
                    onClick={goToNextYear}
                    icon={RiArrowRightDoubleLine}
                  />
                )}
              </div>
            </div>
          );
        },
        Day: ({ date, displayMonth }: DayProps) => {
          const buttonRef = useRef<HTMLButtonElement | null>(null);

          const { activeModifiers, buttonProps, divProps, isButton, isHidden } =
            useDayRender(
              date,
              displayMonth,
              buttonRef as React.RefObject<HTMLButtonElement>
            );

          const {
            selected,
            today,
            disabled,
            range_middle,
            range_start,
            range_end,
          } = activeModifiers;

          if (isHidden) {
            return <></>;
          }

          if (!isButton) {
            return (
              <div
                {...divProps}
                className={cn(
                  "flex items-center justify-center",
                  divProps.className
                )}
              />
            );
          }

          const {
            children: buttonChildren,
            className: buttonClassName,
            ...buttonPropsRest
          } = buttonProps;

          const isSingleDay = range_start && range_end;

          return (
            <div className="relative flex items-center justify-center">
              {range_start && !isSingleDay && (
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[#ECFBFA] -z-10" />
              )}
              {range_end && !isSingleDay && (
                <div className="absolute inset-y-0 left-0 w-1/2 bg-[#ECFBFA] -z-10" />
              )}
              <button
                ref={buttonRef}
                {...buttonPropsRest}
                type="button"
                className={cn("relative", buttonClassName)}
              >
                {buttonChildren}
                {today && !disabled && (
                  <span
                    className={cn(
                      "absolute inset-x-1/2 bottom-1.5 h-0.5 w-4 -translate-x-1/2 rounded-[2px]",
                      {
                        "bg-white! dark:bg-gray-950!": selected,
                        "bg-gray-400! dark:bg-gray-600!":
                          selected && range_middle,
                      }
                    )}
                  />
                )}
              </button>
            </div>
          );
        },
      }}
      tremor-id="tremor-raw"
      {...(props as SingleProps & RangeProps)}
    />
  );
};

Calendar.displayName = "Calendar";

export { Calendar, type Matcher };
