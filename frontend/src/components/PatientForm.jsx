import { useState } from "react";
import API from "../services/api";
import { User, Calendar, Activity, Heart, Scale, UserPlus, Cpu, CheckCircle, RotateCcw } from "lucide-react";
import "./PatientForm.css";

function PatientForm({ refresh }) {
  const empty = { name: "", age: "", gender: "Male", bmi: "", glucose: "", bloodPressure: "" };
  const [form, setForm]       = useState(empty);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age) { alert("Please fill in at least Name and Age."); return; }
    setLoading(true);
    try {
      await API.post("/patients", form);
      setForm(empty);
      setSuccess(true);
      if (refresh) refresh();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name",          label: "Full Name",           type: "text",   icon: User,     placeholder: "e.g. Eleanor Vance" },
    { name: "age",           label: "Age",                 type: "number", icon: Calendar, placeholder: "e.g. 45" },
    { name: "bmi",           label: "BMI (kg/m²)",         type: "number", icon: Scale,    placeholder: "e.g. 26.4" },
    { name: "glucose",       label: "Glucose (mg/dL)",     type: "number", icon: Activity, placeholder: "e.g. 110" },
    { name: "bloodPressure", label: "Blood Pressure",      type: "text",   icon: Heart,    placeholder: "e.g. 120/80" },
  ];

  return (
    <form className="patient-form-card" onSubmit={submit}>
      {/* Header */}
      <div className="form-header-group">
        <div className="form-header-icon">
          <UserPlus size={20} />
        </div>
        <div className="form-header-text">
          <h3>Quick Add Patient Record</h3>
          <p>Input clinical vitals — AI will automatically compute risk assessment</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span className="ai-chip"><Cpu size={10} /> AI Enabled</span>
        </div>
      </div>

      <div className="form-body">
        {/* Success toast */}
        {success && (
          <div className="form-success-toast">
            <CheckCircle size={16} />
            Patient record registered successfully! Risk prediction generated.
          </div>
        )}

        <div className="form-section-divider">Patient Information</div>

        <div className="patient-form-grid">
          {fields.map(({ name, label, type, icon: Icon, placeholder }) => (
            <div className="form-field-wrapper" key={name}>
              <label>{label}</label>
              <div className="input-with-icon">
                <Icon className="field-icon" size={15} />
                <input
                  id={`field-${name}`}
                  name={name}
                  type={type}
                  className="form-control"
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                />
              </div>
            </div>
          ))}

          {/* Gender select */}
          <div className="form-field-wrapper">
            <label>Gender</label>
            <select id="field-gender" name="gender" className="form-control" value={form.gender} onChange={handleChange}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="form-actions-row">
        <div className="form-actions-left">
          Fields marked with * are required for AI risk prediction
        </div>
        <div className="form-actions-right">
          <button type="button" className="btn-secondary" onClick={() => setForm(empty)}>
            <RotateCcw size={14} />
            Reset
          </button>
          <button id="submit-patient" type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            ) : (
              <UserPlus size={15} />
            )}
            {loading ? "Processing..." : "Submit & Predict Risk"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default PatientForm;