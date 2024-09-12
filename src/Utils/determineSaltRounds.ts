export function determineSaltRounds(password: string): number {
    const passwordLength = password.length;

    if (passwordLength < 8) {
        return 12;  // Short passwords need stronger hashing
    } else if (passwordLength < 10) {
        return 10;  // Reasonable balance for moderately short passwords
    } else if (passwordLength < 14) {
        return 12;  // Balanced security for medium-length passwords
    } else if (passwordLength < 18) {
        return 14;  // Strong security for longer passwords
    } else {
        return 16;  // Highest security for very long passwords
    }
}
