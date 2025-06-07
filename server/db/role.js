import db from './index.js';

export const getUserRoles = async (userId) => {
    try {
        const sql = 'select roles.title as roleName from user_role_map left join roles on roles.id=user_role_map.role_id where user_role_map.user_id = ?';
        const roles = await db.query(sql, [userId]);
        return roles.map((obj) => obj.roleName);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        throw error;
    }
}
