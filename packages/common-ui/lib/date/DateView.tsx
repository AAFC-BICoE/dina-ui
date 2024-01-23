const DATE_REGEX_NO_TIME = /^\d{4}-\d{2}-\d{2}$/;

interface DateViewProps {
  date?: string | null;
}

/** Common way to display dates across the app. */
export function DateView({ date: dateString }: DateViewProps) {
  if (dateString) {
    const hasTime = !DATE_REGEX_NO_TIME.test(dateString);

    const date = new Date(dateString);

    const displayText = hasTime
      ? new Intl.DateTimeFormat("en-CA", {
          dateStyle: "short",
          timeStyle: "medium"
        }).format(date)
      : dateString;

    return <div className="date-cell">{displayText}</div>;
  }

  return null;
}
