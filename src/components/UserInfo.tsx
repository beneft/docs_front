import React, { useState} from 'react';
import { User , useAuth} from '../context/AuthContext';
import './UserInfo.css';

export const UserProfilePanel = ({ user }: { user: User }) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<User>(user);
    const {refresh, getAccessToken} = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:8081/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAccessToken()}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Update failed");
            alert("Profile updated successfully");
            await refresh();
            setEditing(false);
        } catch (err) {
            alert("Error updating profile");
            console.error(err);
        }
    };

    return (
        <div className="userinfo-panel">
            <h2 className="userinfo-heading">User Profile</h2>

            <div className="userinfo-grid">
                <ProfileField label="Email" value={user.email} />
                <ProfileField label="First Name" value={user.firstName} />
                <ProfileField label="Last Name" value={user.lastName} />
                <ProfileField label="Organization" value={user.organization} />
                <ProfileField label="Position" value={user.position} />
                <ProfileField label="Phone" value={user.phone} />
            </div>

            <button className="userinfo-edit-btn" onClick={() => setEditing(true)}>
                Edit
            </button>

            {editing && (
                <form onSubmit={handleSubmit} className="userinfo-form">
                    <h3>Edit Profile</h3>
                    <div className="userinfo-form-grid">
                        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                        <Input label="Organization" name="organization" value={formData.organization} onChange={handleChange} />
                        <Input label="Position" name="position" value={formData.position} onChange={handleChange} />
                        <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                        <Input label="Email (read-only)" name="email" value={formData.email} readOnly />
                    </div>
                    <div className="userinfo-btn-row">
                        <button type="submit" className="userinfo-submit-btn">Confirm</button>
                        <button type="button" className="userinfo-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
};

const ProfileField = ({ label, value }: { label: string; value: string }) => (
    <div className="userinfo-field">
        <div className="userinfo-label">{label}</div>
        <div className="userinfo-value">{value || "—"}</div>
    </div>
);

const Input = ({
                   label,
                   name,
                   value,
                   onChange,
                   readOnly = false,
               }: {
    label: string;
    name: keyof User;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
}) => (
    <div className="userinfo-input-group">
        <label className="userinfo-input-label">{label}</label>
        <input
            className={`userinfo-input ${readOnly ? "readonly" : ""}`}
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
        />
    </div>
);


export default UserProfilePanel;