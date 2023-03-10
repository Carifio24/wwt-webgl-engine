using System;

public static class Imports
{

    static Imports()
    {
        string[] imports = new string[] { "pako", "uuid" };
        foreach (string library in imports)
        {
            ImportLibrary(library);
        }
    }

    static void ImportLibrary(string library)
    {
        Script.Literal("let {0}", library);
        Script.Literal("if (typeof window !== \"undefined\" && \"{0}\" in window) {", library);
        Script.Literal("  {0} = window[\"{0}\"]", library);
        Script.Literal("} else {");
        Script.Literal("  import('{0}').then(function(result) { {0} = result; })", result);
        Script.Literal("}");
    }
}
