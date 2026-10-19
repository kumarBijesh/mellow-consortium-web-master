export function TextField({
  name,
  label,
  required = false,
  defaultValue,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="adm-label">
        {label}
      </label>
      <input id={name} name={name} type={type} step={step} required={required} defaultValue={defaultValue} className="adm-input" />
    </div>
  );
}

export function SelectField({
  name,
  label,
  required = false,
  defaultValue,
  options,
  placeholder = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="adm-label">
        {label}
      </label>
      <select id={name} name={name} required={required} defaultValue={defaultValue ?? ""} className="adm-input">
        <option value="" className="bg-[#0d1117]">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0d1117]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-muted dark:text-white/70">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="rounded border-line dark:border-white/20 bg-white/5 dark:bg-white/[0.03] accent-teal"
      />
      {label}
    </label>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  rows = 5,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="adm-label">
        {label}
      </label>
      <textarea id={name} name={name} rows={rows} required={required} defaultValue={defaultValue} className="adm-input resize-y" />
    </div>
  );
}
