const Loader = ({ text = "Loading..." }) => {
  return (
    <div style={{ padding: "20px", color: "white", textAlign: "center" }}>
      {text}
    </div>
  );
};

export default Loader;
