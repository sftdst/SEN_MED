import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { colors, radius, shadows, spacing } from '../theme';

const AccessCard = ({ personnel }) => {
  const { first_name, last_name, second_name = '', specialization, Joining_date, user_id, staff_name, departement, photo, photo_url } = personnel;
  const fullName = staff_name || `${first_name} ${second_name} ${last_name}`.trim();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Determine the image source, falling back to constructing from raw photo path if needed
  const getPhotoSrc = () => {
    if (photo_url && photo_url.startsWith('http')) {
      return photo_url;
    }
    if (photo) {
      return `http://localhost:8000/storage/${photo}`;
    }
    return null;
  };

  const displaySrc = getPhotoSrc();

  const initials = (first_name?.[0] || '') + (last_name?.[0] || '');

  return (
    <div style={{
      width: 340,
      background: 'linear-gradient(135deg, #006400 0%, #004d00 100%)',
      borderRadius: radius.lg,
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      boxShadow: shadows.lg,
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />

      <div style={{ display: 'flex', gap: spacing.md, padding: spacing.lg, position: 'relative', zIndex: 1 }}>
        {/* Photo / Initials */}
         <div style={{ flex: 1 }}>
            <div style={{
              width: 90,
              height: 110,
              borderRadius: radius.md,
              background: colors.gray200,
              border: '3px solid white',
              overflow: 'hidden',
              marginBottom: spacing.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt={fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const placeholder = e.currentTarget.nextElementSibling;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: displaySrc ? 'none' : 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: colors.gray400,
                fontSize: 40,
              }}>
                👤
              </div>
            </div>

          {/* Card number */}
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Carte N°
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: colors.white, letterSpacing: '0.5px', marginBottom: 4 }}>
            ACC-{user_id}
          </div>

          {/* Name */}
          <div style={{ fontSize: '18px', fontWeight: 700, color: colors.white, marginBottom: 2, lineHeight: 1.2 }}>
            {first_name}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: colors.white, marginBottom: spacing.xs, lineHeight: 1.2 }}>
            {last_name}
          </div>

          {/* Specialty */}
          {specialization && (
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: spacing.sm,
              fontStyle: 'italic'
            }}>
              {specialization}
            </div>
          )}

          {/* Department */}
          {departement?.NomDepartement && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.75)',
              marginBottom: spacing.sm,
            }}>
              <span>🏥</span>
              <span>{departement.NomDepartement}</span>
            </div>
          )}

          {/* Join date */}
          {Joining_date && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.75)',
            }}>
              <span>📅</span>
              <span>{formatDate(Joining_date)}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            background: colors.white,
            padding: spacing.xs,
            borderRadius: radius.sm,
          }}>
            <QRCodeSVG
              value={JSON.stringify({
                carte_numero: `ACC-${user_id}`,
                personnel_id: user_id,
                nom: last_name,
                prenom: first_name,
                specialite: specialization,
                departement: departement?.NomDepartement,
                date_entree: Joining_date,
              })}
              size={100}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 24,
        background: 'rgba(0,0,0,0.2)',
        borderTop: `1px solid rgba(255,255,255,0.2)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)'
      }}>
        Carte d'accès professionnel - SEN MED
      </div>
    </div>
  );
};

export default AccessCard;