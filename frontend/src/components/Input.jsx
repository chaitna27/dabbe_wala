function Input({ type = "text", placeholder, value, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        padding: "10px",
        margin: "8px 0",
        width: "100%",
      }}
    />
  );
}

export default Input;
