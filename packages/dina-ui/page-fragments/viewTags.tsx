/* tslint:disable:no-string-literal */
export default function ViewTagsForm(data) {
  return (
    <div>
      {data &&
        data.meta &&
        data.meta.acTags &&
        data.meta.acTags.map(acTag => (
          <>
            <label>
              <strong style={{ background: "#AEB404", borderRadius: "25px" }}>
                <span>&nbsp;&nbsp;</span>
                {acTag}
                <span>&nbsp;&nbsp;</span>
              </strong>
            </label>
            <span>&nbsp;&nbsp;</span>
          </>
        ))}
    </div>
  );
}
/* tslint:enable:no-string-literal */
