/* tslint:disable:no-string-literal */
export default function ViewTagsForm(data) {
  return (
    <div>
      {data &&
        data.meta.acTags &&
        data.meta.acTags.map(acTag => (
          <label key={acTag} className="col-sm-1">
            <strong
              style={{ background: "#ffffcc", borderRadius: "100px/99px" }}
            >
              {" "}
              &nbsp;&nbsp;{acTag}&nbsp;&nbsp;{" "}
            </strong>
          </label>
        ))}
    </div>
  );
}
/* tslint:enable:no-string-literal */
