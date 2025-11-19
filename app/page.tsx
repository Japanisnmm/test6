"use client";

import {
  DateRange,
  DateRangePicker,
} from "@/components/CalendarPicker.tsx/CalendarPicker";
import { th } from "date-fns/locale";
import { useState } from "react";

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

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getDefaultRange()
  );

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

  const getNextMonth = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  };

  return (
    <div className="flex flex-col items-center gap-y-4 py-4">
      <DateRangePicker
        enableYearNavigation
        presets={presets}
        disabledDays={{ after: new Date() }}
        value={dateRange}
        defaultValue={getDefaultRange()}
        toMonth={getNextMonth()}
        onChange={setDateRange}
        locale={th}
        className="w-60"
        translations={{
          apply: "ตกลง",
          cancel: "ยกเลิก",
          reset: "เคลียร์ค่า",
        }}
      />
    </div>
  );
};

export default Home;
