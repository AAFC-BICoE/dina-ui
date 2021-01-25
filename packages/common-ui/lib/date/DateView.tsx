interface DateViewProps {
  date?: string | null;
}

/** Common way to display dates across the app. */
export function DateView({ date: dateString }: DateViewProps) {
  if (dateString) {
    const jsDate = new Date(dateString);
    const compactLocaleString = jsDate.toLocaleString("en-CA");
    const fullDateString = jsDate.toString();

    return (
      <div className="date-cell" title={fullDateString}>
        {compactLocaleString}
      </div>
    );
  }

  return null;
}
