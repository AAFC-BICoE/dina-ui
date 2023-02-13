import { KitsuResource } from "kitsu";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldSet, QueryPage, QueryPageProps } from "..";
import { DINAUI_MESSAGES_ENGLISH } from "../../../dina-ui/intl/dina-ui-en";

export interface CustomQueryPageViewProps<TData extends KitsuResource>
  extends QueryPageProps<TData> {
  titleKey: keyof typeof DINAUI_MESSAGES_ENGLISH;
}

export function CustomQueryPageView<TData extends KitsuResource>({
  titleKey,
  ...queryPageProps
}: CustomQueryPageViewProps<TData>) {
  return (
    <FieldSet legend={<DinaMessage id={titleKey} />}>
      <QueryPage<TData> {...queryPageProps} />
    </FieldSet>
  );
}
