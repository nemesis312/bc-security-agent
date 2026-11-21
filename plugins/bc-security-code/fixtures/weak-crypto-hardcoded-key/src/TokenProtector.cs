using System.Security.Cryptography;
using System.Text;

public static class TokenProtector
{
    private static readonly byte[] Key = Encoding.ASCII.GetBytes("fixture-key-0000");

    public static byte[] Protect(string plaintext)
    {
        using var aes = Aes.Create();
        aes.Key = Key;
        aes.Mode = CipherMode.ECB;
        using var enc = aes.CreateEncryptor();
        var data = Encoding.UTF8.GetBytes(plaintext);
        return enc.TransformFinalBlock(data, 0, data.Length);
    }
}
