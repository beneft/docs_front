import React, { useState } from 'react';
import { User, useAuth } from '../context/AuthContext';
import './UserInfo.css';
import { useTranslation } from 'react-i18next';

export const UserProfilePanel = ({ user }: { user: User }) => {
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [formData, setFormData] = useState<User>(user);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { refresh, getAccessToken } = useAuth();
    const { t } = useTranslation('userinfo');

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstName.trim()) newErrors.firstName = t('error-required');
        if (!formData.lastName.trim()) newErrors.lastName = t('error-required');

        if (changingPassword) {
            if (!oldPassword.trim()) newErrors.oldPassword = t('error-required');
            if (!newPassword.trim()) newErrors.newPassword = t('error-required');
            else if (newPassword.length < 6) newErrors.newPassword = t('pass-too-short');
            if (!confirmNewPassword.trim()) newErrors.confirmNewPassword = t('error-required');
            else if (newPassword !== confirmNewPassword)
                newErrors.confirmNewPassword = t('pass-not-match');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        if (changingPassword && newPassword !== confirmNewPassword) {
            alert(t('pass-not-match'));
            return;
        }

        try {
            const profileRes = await fetch("http://localhost:8081/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAccessToken()}`,
                },
                body: JSON.stringify(formData),
            });

            if (!profileRes.ok) throw new Error(t('profile-update-failed'));

            if (changingPassword) {
                const passRes = await fetch("http://localhost:8081/api/auth/password", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getAccessToken()}`,
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        oldPassword,
                        newPassword,
                    }),
                });

                if (!passRes.ok) {
                    const body = await passRes.text();
                    throw new Error(body || t('password-change-failed'));
                }
            }

            alert(t('profile-update-success'));
            await refresh();
            setEditing(false);
            setChangingPassword(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setIsSubmitting(false);
        } catch (err: any) {
            alert(err.message || t('update-failed'));
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="userinfo-panel">
            <h2 className="userinfo-heading">{t('profile-title')}</h2>

            <div className="userinfo-grid">
                <ProfileField label={t('email')} value={user.email} />
                <ProfileField label={t('first-name')} value={user.firstName} />
                <ProfileField label={t('last-name')} value={user.lastName} />
                <ProfileField label={t('organization')} value={user.organization} />
                <ProfileField label={t('position')} value={user.position} />
                <ProfileField label={t('phone')} value={user.phone} />
                <ProfileField label={t('iin')} value={user.iin} />
            </div>

            <button className="userinfo-edit-btn" onClick={() => setEditing(true)}>
                {t('edit')}
            </button>

            {editing && (
                <form onSubmit={handleSubmit} className="userinfo-form">
                    <h3>{t('edit-profile')}</h3>
                    <div className="userinfo-form-grid">
                        <Input label={t('first-name')} name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
                        <Input label={t('last-name')} name="lastName" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
                        <Input label={t('organization')} name="organization" value={formData.organization} onChange={handleChange} />
                        <Input label={t('position')} name="position" value={formData.position} onChange={handleChange} />
                        <Input label={t('phone')} name="phone" value={formData.phone} onChange={handleChange} />
                        <Input label={t('iin')} name="iin" value={formData.iin} onChange={handleChange} />
                        <Input label={t('email-readonly')} name="email" value={formData.email} readOnly />
                    </div>

                    {!changingPassword && (
                        <button
                            type="button"
                            className="userinfo-change-password-btn"
                            onClick={() => setChangingPassword(true)}
                        >
                            {t('change-password')}
                        </button>
                    )}

                    {changingPassword && (
                        <div className="userinfo-password-section">
                            <InputPassword label={t('old-password')} value={oldPassword} onChange={setOldPassword} error={errors.oldPassword} />
                            <InputPassword label={t('new-password')} value={newPassword} onChange={setNewPassword} error={errors.newPassword} />
                            <InputPassword label={t('confirm-new-password')} value={confirmNewPassword} onChange={setConfirmNewPassword} error={errors.confirmNewPassword} />
                        </div>
                    )}

                    <div className="userinfo-btn-row">
                        <button type="submit" className="userinfo-submit-btn" disabled={isSubmitting}>
                            {t('confirm')}
                        </button>
                        <button type="button" className="userinfo-cancel-btn" onClick={() => {
                            setEditing(false);
                            setChangingPassword(false);
                        }}>
                            {t('cancel')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

const ProfileField = ({ label, value }: { label: string; value: string }) => {
    const { t } = useTranslation('userinfo');
    return (
        <div className="userinfo-field">
            <div className="userinfo-label">{label}</div>
            <div className="userinfo-value">{value || t('empty-placeholder')}</div>
        </div>
    );
};

const Input = ({
                   label,
                   name,
                   value,
                   onChange,
                   readOnly = false,
                   error,
               }: {
    label: string;
    name: keyof User;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
    error?: string;
}) => (
    <div className="userinfo-input-group">
        <label className="userinfo-input-label">{label}</label>
        <input
            className={`userinfo-input ${readOnly ? "readonly" : ""} ${error ? "invalid" : ""}`}
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
        />
        {error && <div className="userinfo-error">{error}</div>}
    </div>
);

const InputPassword = ({
                           label,
                           value,
                           onChange,
                           error,
                       }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    error?: string;
}) => (
    <div className="userinfo-input-group">
        <label className="userinfo-input-label">{label}</label>
        <input
            className={`userinfo-input ${error ? "invalid" : ""}`}
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        {error && <div className="userinfo-error">{error}</div>}
    </div>
);


export default UserProfilePanel;