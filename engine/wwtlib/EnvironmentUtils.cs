using System;

public class EnvironmentUtils
{

    public static bool isWindowUndefined()
    {
        return Script.IsUndefined(Script.GetScriptType(Script.Literal("window")));
    }

    public static bool isDocumentUndefined()
    {
        return Script.IsUndefined(Script.GetScriptType(Script.Literal("document")));
    }

    public static bool isNavigatorUndefined()
    {
        return Script.IsUndefined(Script.GetScriptType(Script.Literal("navigator")));
    }
}