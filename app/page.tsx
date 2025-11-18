"use client";

import {
  DateRange,
  DateRangePicker,
} from "@/components/CalendarPicker.tsx/CalendarPicker";
import { th } from "date-fns/locale";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useRef } from "react";

type FormData = {
  dateRange: DateRange | undefined;
};

const Home = () => {
  const getDefaultRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return {
      from: sevenDaysAgo,
      to: today,
    };
  };

  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      dateRange: getDefaultRange(),
    },
  });

  const formatDateRange = (dateRange: DateRange | undefined) => {
    if (!dateRange) return null;

    const formatDate = (date: Date | undefined) => {
      if (!date) return "";
      return format(date, "dd/MM/yyyy");
    };

    return {
      from: dateRange.from ? formatDate(dateRange.from) : "",
      to: dateRange.to ? formatDate(dateRange.to) : "",
      fromDate: dateRange.from,
      toDate: dateRange.to,
    };
  };

  const onSubmit = (data: FormData) => {
    const formatted = formatDateRange(data.dateRange);
    console.log("Form data (formatted):", formatted);
  };

  const dateRange = watch("dateRange");
  const isFirstRender = useRef(true);
  const previousDateRange = useRef<DateRange | undefined>(dateRange);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDateRange.current = dateRange;
      return;
    }

    const hasChanged =
      dateRange?.from !== previousDateRange.current?.from ||
      dateRange?.to !== previousDateRange.current?.to;

    if (dateRange && hasChanged) {
      handleSubmit(onSubmit)();
    }

    previousDateRange.current = dateRange;
  }, [dateRange, handleSubmit]);

  const presets = [
    {
      label: "วันนี้",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "เมื่อวาน",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 1)),
        to: new Date(),
      },
    },
    {
      label: "7 วันล่าสุด",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: "14 วันล่าสุด",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 14)),
        to: new Date(),
      },
    },
    {
      label: "30 วันล่าสุด",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
    {
      label: "1 ปีย้อนหลัง",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        to: new Date(),
      },
    },
  ];

  return (
    <div className="flex flex-col items-center gap-y-4 py-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="dateRange"
          control={control}
          render={({ field: { onChange, onBlur, value, name } }) => (
            <DateRangePicker
              enableYearNavigation
              presets={presets}
              toDate={new Date()}
              defaultValue={getDefaultRange()}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              name={name}
              locale={th}
              className="w-60"
              translations={{
                apply: "ยืนยัน",
                cancel: "ยกเลิก",
                reset: "เคลียร์ค่า",
              }}
            />
          )}
        />
      </form>
    </div>
  );
};

export default Home;
